import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { AiMatchDto } from './dto/ai-match.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('match')
  @ApiOperation({
    summary: 'AI-powered professional matching',
    description:
      'Takes a free-text description of the user\'s situation and returns the top 3 most suitable professionals with personalized explanations. ' +
      'Free accounts receive 3 matches total; Health Plus members have unlimited access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns { matches: [{ professional, reason }], usageCount, remainingFreeMatches }',
  })
  @ApiResponse({ status: 403, description: 'Free match limit reached — upgrade to Plus' })
  match(@CurrentUser() user: User, @Body() dto: AiMatchDto) {
    return this.aiService.match(user.id, dto.message);
  }
}
