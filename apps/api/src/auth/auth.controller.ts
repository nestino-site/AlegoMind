import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Register a SEEKER or PROFESSIONAL account' })
  @ApiResponse({ status: 201, description: 'Verification email sent' })
  @ApiResponse({ status: 409, description: 'Email or username already in use' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Verify email with OTP — returns tokens on success' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Resend email verification OTP' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Login — returns access + refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({
    summary: 'Rotate refresh token — body: { refreshToken }',
    description: 'Consumes the current refresh token and issues a new access + refresh pair (rotation)',
  })
  refresh(@Request() req: any) {
    const { user, jti } = req.user as { user: User; jti: string };
    return this.authService.refresh(user, jti);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session — invalidates the provided refresh token' })
  logout(@CurrentUser() user: User, @Body() dto: RefreshDto) {
    // Extract jti from the refresh token without full validation
    // (we trust the access token guard; we just need the jti to revoke)
    try {
      const payload = JSON.parse(
        Buffer.from(dto.refreshToken.split('.')[1], 'base64').toString(),
      ) as { jti?: string };
      return this.authService.logout(user.id, payload.jti ?? '');
    } catch {
      return { message: 'Logged out' };
    }
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout all sessions for this user' })
  logoutAll(@CurrentUser() user: User) {
    return this.authService.logoutAll(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Request a password reset OTP' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Reset password with OTP code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
