import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleBookingDto {
  @ApiProperty({ example: '2026-07-15T14:00:00Z', description: 'New session datetime (future date, ISO 8601)' })
  @IsDateString()
  scheduledAt: string;
}
