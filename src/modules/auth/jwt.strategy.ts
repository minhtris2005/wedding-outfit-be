// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Lấy từ cookie
          const token = request?.cookies?.access_token;
          if (token) {
            return token;
          }

          // Fallback: lấy từ header
          const authHeader = request.headers.authorization;
          if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type === 'Bearer') {
              return token;
            }
          }

          return null;
        },
      ]),
      secretOrKey: configService.get('JWT_SECRET') || 'SECRET_KEY_DO_AN',
    });
  }

  async validate(payload: any) {
    // Kiểm tra payload có đủ thông tin không
    if (!payload) {
      return null;
    }

    // Trả về user object đầy đủ
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'user', // Fallback nếu không có role
    };
  }
}
