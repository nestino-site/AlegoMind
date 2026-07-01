import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TopicType {
  FREE = 'FREE',
  PAID = 'PAID',
}

export class SelectTopicDto {
  @ApiProperty({ description: 'Human-readable label for the selected topic' })
  @IsString()
  topicLabel: string;

  @ApiProperty({ enum: TopicType })
  @IsEnum(TopicType)
  topicType: TopicType;

  @ApiPropertyOptional({ description: 'ID of the ChatService (required when topicType=PAID)' })
  @IsOptional()
  @IsUUID()
  chatServiceId?: string;

  @ApiPropertyOptional({ description: 'Cost in RON (required when topicType=PAID)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
