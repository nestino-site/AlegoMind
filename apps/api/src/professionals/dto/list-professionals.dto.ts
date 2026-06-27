import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalType, SessionFormat } from '@prisma/client';

export class ListProfessionalsDto {
  @ApiPropertyOptional({ enum: ProfessionalType })
  @IsOptional()
  @IsEnum(ProfessionalType)
  type?: ProfessionalType;

  @ApiPropertyOptional({ example: 'Burnout', description: 'Partial-match on specializations' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  sessionFormat?: SessionFormat;

  @ApiPropertyOptional({ description: 'Only professionals with an availability window right now' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  availableNow?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Maximum price per session in RON' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'ro', description: 'Language code the professional speaks' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    example: 'female',
    enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'],
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  availableForTrial?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
