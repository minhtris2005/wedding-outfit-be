// auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/User';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from 'src/entities/RefreshToken';
import { LoginDto } from 'src/dto/login.dto';
import { RegisterDto } from 'src/dto/register.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService, // Thêm ConfigService
  ) {}

  // ==================== COOKIE HANDLING ====================
  setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      // Trên Production (Railway) bắt buộc phải là true để dùng được sameSite: 'none'
      secure: true,
      // 'none' cho phép gửi cookie giữa các domain khác nhau (Vercel <-> Railway)
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/',
    });
  }

  clearAuthCookies(response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
  }

  // ==================== AUTH LOGIC ====================
  async validateUser(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_REFRESH_SECRET') ||
        this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
    });

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') ||
          this.configService.get('JWT_SECRET'),
      });

      const tokenExists = await this.refreshTokenRepo.findOne({
        where: {
          token: refreshToken,
          userId: payload.sub,
          isRevoked: false,
        },
      });

      if (!tokenExists) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      const newAccessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
        },
        {
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') || '15m',
        },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepo.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = this.usersRepo.create({
      email: registerDto.email,
      password: hashedPassword,
      role: 'user',
    });

    await this.usersRepo.save(newUser);

    return {
      message: 'Tạo tài khoản thành công',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  async logout(userId: number, refreshToken: string) {
    await this.refreshTokenRepo.update(
      { token: refreshToken, userId },
      { isRevoked: true },
    );
  }

  async logoutAll(userId: number) {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async getProfile(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    return user;
  }

  // ==================== PRIVATE METHODS ====================
  private async saveRefreshToken(userId: number, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.delete({ userId });

    const refreshToken = this.refreshTokenRepo.create({
      userId,
      token,
      expiresAt,
    });

    await this.refreshTokenRepo.save(refreshToken);
  }

  // ==================== ROLE CHECK ====================
  async checkRole(userId: number, requiredRole: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    const hasRole = user.role === requiredRole;
    if (!hasRole) {
      throw new UnauthorizedException(`Yêu cầu role ${requiredRole}`);
    }

    return true;
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.validateUser(email, currentPassword);

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được giống mật khẩu cũ',
      );
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersRepo.update({ id: user.id }, { password: hashedPassword });

    await this.refreshTokenRepo.update(
      { userId: user.id, isRevoked: false },
      { isRevoked: true },
    );

    return {
      message: 'Đổi mật khẩu thành công',
      statusCode: 200,
    };
  }
}
