import {
  IsEmail,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'andrei.popescu@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ enum: AccountType, example: AccountType.SEEKER })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({ example: 'andrei_p', description: 'Auto-generated if omitted' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, { message: 'Username can only contain lowercase letters, numbers, and underscores' })
  username?: string;

  @ApiPropertyOptional({ example: 'Andrei', description: 'Required unless isAnonymous = true' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Andrei P.', description: 'Public display name — can be a nickname' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Skip name — only a display nickname is used publicly',
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({ example: 'ro', default: 'ro' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
