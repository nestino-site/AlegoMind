import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'The refresh token received at login or previous refresh' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
