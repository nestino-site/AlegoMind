import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller({ path: 'reviews', version: '1' })
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Get reviews for a professional' })
  findByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.findByProfessional(professionalId, Number(page), Number(limit));
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a review for a completed booking' })
  create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }
}
