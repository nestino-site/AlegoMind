import { IsString, IsEnum, IsInt, IsDateString, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionFormat } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  professionalId: string;

  @ApiProperty({ enum: SessionFormat })
  @IsEnum(SessionFormat)
  sessionType: SessionFormat;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(30)
  durationMinutes: number;

  @ApiProperty({ example: '2026-07-01T10:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTrial?: boolean;
}
