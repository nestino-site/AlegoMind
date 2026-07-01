import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
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
import { SelectTopicDto } from './dto/select-topic.dto';
import { ConfirmTopicPaymentDto } from './dto/confirm-topic-payment.dto';
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
  @ApiOperation({ summary: 'Start a conversation with a professional (returns existing if one already exists)' })
  createConversation(@CurrentUser() user: User, @Body() dto: CreateConversationDto) {
    return this.messagesService.createConversation(user.id, dto.professionalId);
  }

  @Get()
  @ApiOperation({ summary: "Get the authenticated user's conversations (seeker side)" })
  getConversations(@CurrentUser() user: User) {
    return this.messagesService.getMyConversations(user.id);
  }

  @Get('professional')
  @ApiOperation({ summary: "Get conversations for the authenticated professional (pro inbox)" })
  getProConversations(@CurrentUser() user: User) {
    return this.messagesService.getProConversations(user.id);
  }

  @Post('unread-counts')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get actual unread message counts for a set of conversations' })
  getUnreadCounts(
    @CurrentUser() user: User,
    @Body() body: { readTimestamps: Record<string, string> },
  ) {
    return this.messagesService.getUnreadCounts(user.id, body.readTimestamps ?? {});
  }

  @Get(':id/options')
  @ApiOperation({ summary: 'Get available topic options for a conversation (free booking option + paid chat services)' })
  getOptions(@Param('id') id: string, @CurrentUser() user: User) {
    return this.messagesService.getConversationOptions(id, user.id);
  }

  @Post(':id/select-topic')
  @ApiOperation({ summary: 'Select a topic to activate the conversation. FREE activates immediately; PAID returns a Stripe clientSecret.' })
  selectTopic(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SelectTopicDto,
  ) {
    return this.messagesService.selectTopic(id, user.id, dto);
  }

  @Post(':id/confirm-topic-payment')
  @ApiOperation({ summary: 'Confirm that payment for a paid topic has succeeded and activate the conversation.' })
  confirmTopicPayment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ConfirmTopicPaymentDto,
  ) {
    return this.messagesService.confirmTopicPayment(id, user.id, dto.paymentIntentId);
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

  @Post(':id/end-session')
  @ApiOperation({ summary: 'Professional ends the active session — resets conversation to PENDING_TOPIC' })
  async endSession(@Param('id') id: string, @CurrentUser() user: User) {
    const result = await this.messagesService.endSession(id, user.id);
    this.messagesGateway.broadcastMessage(id, result.message);
    this.messagesGateway.broadcastConversationReset(id);
    return result;
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

    this.messagesGateway.broadcastMessage(id, message);

    return message;
  }
}
