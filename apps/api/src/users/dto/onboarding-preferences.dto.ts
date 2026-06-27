import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionFormat, ProfessionalType } from '@prisma/client';

export const SEEKER_TOPICS = [
  'anxiety',
  'depression',
  'relationships',
  'career',
  'trauma',
  'burnout',
  'grief',
  'stress',
  'self_esteem',
  'life_transitions',
  'addiction',
  'family',
  'parenting',
  'identity',
  'sleep',
  'motivation',
] as const;

export type SeekerTopic = (typeof SEEKER_TOPICS)[number];

export class OnboardingPreferencesDto {
  @ApiProperty({
    isArray: true,
    enum: SEEKER_TOPICS,
    example: ['anxiety', 'burnout'],
    description: 'Topics the seeker wants to work on',
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  @IsIn(SEEKER_TOPICS, { each: true })
  topics: SeekerTopic[];

  @ApiProperty({
    isArray: true,
    enum: SessionFormat,
    example: ['VIDEO', 'TEXT'],
    description: 'Preferred session formats',
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsEnum(SessionFormat, { each: true })
  communicationFormats: SessionFormat[];

  @ApiPropertyOptional({
    example: 'female',
    enum: ['male', 'female', 'any'],
    description: 'Preferred provider gender',
  })
  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'any'])
  providerGender?: string;

  @ApiPropertyOptional({ example: 25, description: 'Minimum provider age (inclusive)' })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(80)
  providerAgeMin?: number;

  @ApiPropertyOptional({ example: 50, description: 'Maximum provider age (inclusive)' })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(80)
  providerAgeMax?: number;

  @ApiPropertyOptional({
    enum: ProfessionalType,
    example: 'THERAPIST',
    description: 'Preferred type of professional, chosen as the first onboarding step',
  })
  @IsOptional()
  @IsEnum(ProfessionalType)
  preferredType?: ProfessionalType;
}
