import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AccountType, SenderType } from '@prisma/client';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*', credentials: true } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth as Record<string, string>).token ??
        client.handshake.headers.authorization;

      const token = raw?.replace(/^Bearer\s+/i, '');
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify<{ sub: string; type: string }>(token, {
        secret: this.config.get<string>('app.jwtSecret'),
      });

      if (payload.type !== 'access') throw new Error('Not an access token');

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error('User not found');

      client.data.user = user;
      this.logger.log(`WS connected: ${user.id}`);
    } catch (err: any) {
      this.logger.warn(`WS auth failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data.user as { id: string } | undefined)?.id;
    if (userId) this.logger.log(`WS disconnected: ${userId}`);
  }

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    // Wrap everything — NestJS WsExceptionsHandler crashes the process on Node.js v24
    // when any exception reaches its instanceof check. Never let an exception escape.
    try {
      const user = client.data.user as { id: string } | undefined;
      if (!user?.id) return { error: 'Not authenticated' };

      await this.messagesService.assertAccess(conversationId, user.id);
      await client.join(conversationId);

      // Mark conversation as read and notify the other party
      try {
        const { readAt, isSeeker } = await this.messagesService.markConversationRead(conversationId, user.id);
        client.to(conversationId).emit('messages:read', {
          conversationId,
          readAt: readAt.toISOString(),
          isSeeker,
        });
      } catch { /* non-fatal */ }

      return { status: 'joined', conversationId };
    } catch {
      return { error: 'Conversation not found or access denied' };
    }
  }

  @SubscribeMessage('read')
  async handleRead(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    try {
      const user = client.data.user as { id: string } | undefined;
      if (!user?.id) return { error: 'Not authenticated' };

      const { readAt, isSeeker } = await this.messagesService.markConversationRead(conversationId, user.id);
      client.to(conversationId).emit('messages:read', {
        conversationId,
        readAt: readAt.toISOString(),
        isSeeker,
      });
      return { status: 'ok' };
    } catch {
      return { error: 'Failed' };
    }
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    try {
      client.leave(conversationId);
      return { status: 'left', conversationId };
    } catch {
      return { error: 'Failed' };
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    try {
      const user = client.data.user as { id: string; accountType: AccountType } | undefined;
      if (!user?.id) return { error: 'Not authenticated' };

      const senderType =
        user.accountType === AccountType.PROFESSIONAL ? SenderType.PROFESSIONAL : SenderType.USER;

      const message = await this.messagesService.sendMessage(
        payload.conversationId,
        user.id,
        payload.content,
        senderType,
      );
      this.server.to(payload.conversationId).emit('message', message);
      return { status: 'sent', messageId: message.id };
    } catch (err: any) {
      return { error: err.message ?? 'Failed to send message' };
    }
  }

  // Called by MessagesController after HTTP message creation to sync real-time clients
  broadcastMessage(conversationId: string, message: unknown) {
    this.server.to(conversationId).emit('message', message);
  }

  // Called when professional ends the session — seeker's chat resets to topic selection
  broadcastConversationReset(conversationId: string) {
    this.server.to(conversationId).emit('conversation:reset');
  }
}
