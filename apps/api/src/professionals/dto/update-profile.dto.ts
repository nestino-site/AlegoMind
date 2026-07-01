import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  @ApiPropertyOptional({ description: 'Toggle whether the professional accepts new bookings' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Custom welcome message sent when a new conversation starts. Leave empty to use the default.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  welcomeMessage?: string | null;

  @ApiPropertyOptional({ description: 'Custom response sent after a seeker selects a topic. Use {topic} as placeholder for the topic name.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  topicResponseTemplate?: string | null;
}
