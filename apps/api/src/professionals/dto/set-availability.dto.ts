import { IsEnum, IsString, IsArray, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class AvailabilitySlotDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '09:00', description: '24-hour HH:MM' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24-hour)' })
  startTime: string;

  @ApiProperty({ example: '17:00', description: '24-hour HH:MM' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM (24-hour)' })
  endTime: string;
}

export class SetAvailabilityDto {
  @ApiProperty({
    isArray: true,
    type: AvailabilitySlotDto,
    description: 'Replaces ALL existing weekly availability slots',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
