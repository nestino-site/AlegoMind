import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ example: 'andrei.popescu@example.com' })
  @IsEmail()
  email: string;
}
