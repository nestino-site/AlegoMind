import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-07-01', description: 'Start date YYYY-MM-DD (inclusive)' })
  @IsString()
  @Matches(DATE_REGEX, { message: 'from must be YYYY-MM-DD' })
  from: string;

  @ApiProperty({ example: '2026-07-31', description: 'End date YYYY-MM-DD (inclusive, max 60 days)' })
  @IsString()
  @Matches(DATE_REGEX, { message: 'to must be YYYY-MM-DD' })
  to: string;
}
