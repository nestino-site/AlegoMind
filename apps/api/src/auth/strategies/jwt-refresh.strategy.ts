import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwtRefreshSecret') as string,
    });
  }

  async validate(payload: JwtRefreshPayload) {
    if (payload.type !== 'refresh') throw new UnauthorizedException();

    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        jti: payload.jti,
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) throw new UnauthorizedException('Refresh token revoked or expired');

    // Surface the jti so the service can rotate it
    return { user: stored.user, jti: payload.jti };
  }
}
