// auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/User';
import { JwtService } from '@nestjs/jwt';
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
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 phút
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
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET || 'REFRESH_SECRET_KEY',
      expiresIn: '7d',
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
        secret: process.env.REFRESH_SECRET || 'REFRESH_SECRET_KEY',
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
          expiresIn: '15m',
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
      select: ['id', 'email', 'role'], // Chỉ lấy các field cần thiết
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
    // Dùng hàm validateUser để kiểm tra email + mật khẩu hiện tại
    // Hàm này đã tự động throw error nếu sai
    const user = await this.validateUser(email, currentPassword);

    // Kiểm tra mật khẩu mới không được giống mật khẩu cũ
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được giống mật khẩu cũ',
      );
    }

    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới
    await this.usersRepo.update({ id: user.id }, { password: hashedPassword });

    // Vô hiệu hóa tất cả refresh tokens cũ (bắt buộc đăng nhập lại)
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
