import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID of the professional to start a conversation with' })
  @IsString()
  @IsUUID()
  professionalId: string;
}
