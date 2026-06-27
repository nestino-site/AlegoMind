import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AccountType, OtpType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { v4 as uuid } from 'uuid';

const OTP_EXPIRY_MINUTES = 10;
const OTP_BCRYPT_ROUNDS = 10;
const PASSWORD_BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  // ─── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Anonymous users must still provide a displayName for the UI to show something
    if (!dto.isAnonymous && !dto.firstName) {
      throw new BadRequestException('firstName is required unless isAnonymous is true');
    }
    if (dto.isAnonymous && !dto.displayName) {
      throw new BadRequestException('displayName is required for anonymous accounts');
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.username ? [{ username: dto.username }] : []),
        ],
      },
    });
    if (existing) throw new ConflictException('Email or username already in use');

    const username = dto.username ?? `user_${randomBytes(6).toString('hex')}`;
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username,
        passwordHash,
        accountType: dto.accountType,
        firstName: dto.isAnonymous ? null : dto.firstName,
        displayName: dto.displayName,
        isAnonymous: dto.isAnonymous ?? false,
        preferredLanguage: dto.preferredLanguage ?? 'ro',
        isEmailVerified: false,
      },
    });

    await this.createAndSendOtp(user, OtpType.EMAIL_VERIFICATION);

    return {
      message: 'Verification email sent. Please check your inbox.',
      userId: user.id,
    };
  }

  // ─── Email verification ────────────────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.findUserByEmailOrThrow(dto.email);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.consumeOtp(user.id, dto.code, OtpType.EMAIL_VERIFICATION);

    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return this.issueTokens(verified);
  }

  async resendVerification(email: string) {
    const user = await this.findUserByEmailOrThrow(email);
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    // Invalidate previous EMAIL_VERIFICATION OTPs for this user
    await this.prisma.otpToken.deleteMany({
      where: { userId: user.id, type: OtpType.EMAIL_VERIFICATION, usedAt: null },
    });

    await this.createAndSendOtp(user, OtpType.EMAIL_VERIFICATION);
    return { message: 'Verification email resent.' };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    return this.issueTokens(user);
  }

  // ─── Token refresh ─────────────────────────────────────────────────────────

  async refresh(user: User, oldJti: string) {
    // Rotate: delete old token, issue new pair
    await this.prisma.refreshToken.deleteMany({ where: { jti: oldJti } });
    return this.issueTokens(user);
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string, jti: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId, jti } });
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'All sessions terminated' };
  }

  // ─── Password reset ────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Always respond with the same message to avoid email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset code was sent.' };
    }

    // Invalidate any pending reset OTPs
    await this.prisma.otpToken.deleteMany({
      where: { userId: user.id, type: OtpType.PASSWORD_RESET, usedAt: null },
    });

    await this.createAndSendOtp(user, OtpType.PASSWORD_RESET);
    return { message: 'If that email exists, a reset code was sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.findUserByEmailOrThrow(dto.email);
    await this.consumeOtp(user.id, dto.code, OtpType.PASSWORD_RESET);

    const passwordHash = await bcrypt.hash(dto.newPassword, PASSWORD_BCRYPT_ROUNDS);

    // Revoke all refresh tokens (security: force re-login on all devices)
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: 'Password reset successful. Please log in with your new password.' };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async issueTokens(user: User) {
    const jti = uuid();
    const refreshExpiresIn = this.config.get<string>('app.jwtRefreshExpiresIn', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        accountType: user.accountType,
        tier: user.subscriptionTier,
        type: 'access',
      }),
      this.jwtService.signAsync(
        { sub: user.id, jti, type: 'refresh' },
        {
          secret: this.config.get<string>('app.jwtRefreshSecret'),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    // Store refresh token reference; expiry mirrors the JWT expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, jti, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  private async createAndSendOtp(user: User, type: OtpType) {
    const code = randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, OTP_BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpToken.create({
      data: { userId: user.id, codeHash, type, expiresAt },
    });

    const emailType = type === OtpType.EMAIL_VERIFICATION ? 'verification' : 'reset';
    await this.mail.sendOtp(user.email, code, emailType);
  }

  private async consumeOtp(userId: string, code: string, type: OtpType) {
    const otp = await this.prisma.otpToken.findFirst({
      where: {
        userId,
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired verification code');

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) throw new BadRequestException('Invalid or expired verification code');

    await this.prisma.otpToken.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  }

  private async findUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
