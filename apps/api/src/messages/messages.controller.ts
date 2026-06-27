import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountType, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { SenderType } from '@prisma/client';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'conversations', version: '1' })
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private messagesGateway: MessagesGateway,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Start a conversation with a professional',
    description: 'Free initial contact. Returns existing conversation if one already exists.',
  })
  createConversation(@CurrentUser() user: User, @Body() dto: CreateConversationDto) {
    return this.messagesService.createConversation(user.id, dto.professionalId);
  }

  @Get()
  @ApiOperation({ summary: "Get the authenticated user's conversations" })
  getConversations(@CurrentUser() user: User) {
    return this.messagesService.getMyConversations(user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get paginated message history for a conversation' })
  @ApiResponse({ status: 200, description: 'Returns { messages, total, page, limit, totalPages }' })
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() query: MessagesQueryDto,
  ) {
    return this.messagesService.getMessages(id, user.id, query.page, query.limit);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message — also broadcasts to WebSocket room' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    const senderType =
      user.accountType === AccountType.PROFESSIONAL ? SenderType.PROFESSIONAL : SenderType.USER;

    const message = await this.messagesService.sendMessage(id, user.id, dto.content, senderType);

    // Sync real-time clients who are connected but haven't sent via WS
    this.messagesGateway.broadcastMessage(id, message);

    return message;
  }
}
