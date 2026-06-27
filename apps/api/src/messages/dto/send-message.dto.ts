import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Bună ziua! Aș dori să discutăm despre anxietate.', maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}
