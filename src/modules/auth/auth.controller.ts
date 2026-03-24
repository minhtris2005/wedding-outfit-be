// auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Res,
  Request,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from 'src/dto/register.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { LoginDto } from 'src/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const result = await this.authService.login(loginDto);

    this.authService.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );

    return {
      message: 'Đăng nhập thành công',
      user: result.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const refreshToken = request.cookies?.refresh_token;
    const result = await this.authService.refreshToken(refreshToken);

    this.authService.setAuthCookies(response, result.accessToken, refreshToken);

    return { message: 'Token refreshed' };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: any, @Res({ passthrough: true }) response: any) {
    const refreshToken = request.cookies?.refresh_token;
    const user = request.user;

    if (refreshToken && user) {
      await this.authService.logout(user.id, refreshToken);
    }

    return this.authService.clearAuthCookies(response);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    // Lấy email từ user đã đăng nhập (qua JWT)
    const email = req.user.email;

    return this.authService.changePassword(
      email,
      body.currentPassword,
      body.newPassword,
    );
  }
}
