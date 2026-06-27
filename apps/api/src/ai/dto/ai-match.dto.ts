import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiMatchDto {
  @ApiProperty({
    example: 'Mă simt copleșit la locul de muncă și am probleme cu somnul de câteva săptămâni.',
    description: 'Free-text description of the user\'s situation or feeling',
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}
