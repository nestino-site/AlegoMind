import { IsEmail, IsString, Length, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'andrei.popescu@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '482910', description: '6-digit OTP from the reset email' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ example: 'NewSecure123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
