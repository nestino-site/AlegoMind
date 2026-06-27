import {
  IsEnum,
  IsString,
  IsArray,
  IsNumber,
  IsInt,
  IsBoolean,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalType, SessionFormat } from '@prisma/client';

export const GENDER_OPTIONS = ['male', 'female', 'non_binary', 'prefer_not_to_say'] as const;

export class CreateProfileDto {
  @ApiProperty({ enum: ProfessionalType })
  @IsEnum(ProfessionalType)
  type: ProfessionalType;

  @ApiProperty({ minLength: 50, maxLength: 2000 })
  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  bio: string;

  @ApiProperty({ isArray: true, type: String, example: ['Anxietate', 'Burnout', 'Leadership'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  specializations: string[];

  @ApiProperty({ isArray: true, enum: SessionFormat })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(SessionFormat, { each: true })
  sessionFormats: SessionFormat[];

  @ApiProperty({ isArray: true, type: String, example: ['ro', 'en'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({ example: 250, description: 'Price per session in RON' })
  @IsNumber()
  @Min(50)
  @Max(2000)
  pricePerSession: number;

  @ApiPropertyOptional({ example: 75, description: 'Trial session price in RON' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialPrice?: number;

  @ApiPropertyOptional({ example: 30, description: 'Trial session duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  trialDuration?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  availableForTrial?: boolean;

  @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  yearsExperience?: number;

  @ApiPropertyOptional({ enum: GENDER_OPTIONS })
  @IsOptional()
  @IsString()
  @IsIn(GENDER_OPTIONS)
  gender?: string;
}
