import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'andrei.popescu@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '482910', description: '6-digit OTP sent to the email' })
  @IsString()
  @Length(6, 6)
  code: string;
}
