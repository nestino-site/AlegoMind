import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  @ApiPropertyOptional({ description: 'Toggle whether the professional accepts new bookings' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
