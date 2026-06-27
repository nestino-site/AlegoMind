import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
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
    const userId = (client.data.user as { id: string }).id;

    try {
      await this.messagesService.assertAccess(conversationId, userId);
    } catch {
      throw new WsException('Conversation not found or access denied');
    }

    await client.join(conversationId);
    return { status: 'joined', conversationId };
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.leave(conversationId);
    return { status: 'left', conversationId };
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    const user = client.data.user as { id: string; accountType: AccountType };

    const senderType =
      user.accountType === AccountType.PROFESSIONAL ? SenderType.PROFESSIONAL : SenderType.USER;

    let message: Awaited<ReturnType<MessagesService['sendMessage']>>;
    try {
      message = await this.messagesService.sendMessage(
        payload.conversationId,
        user.id,
        payload.content,
        senderType,
      );
    } catch (err: any) {
      throw new WsException(err.message);
    }

    // Broadcast to all clients in the conversation room (including sender)
    this.server.to(payload.conversationId).emit('message', message);
    return { status: 'sent', messageId: message.id };
  }

  // Called by MessagesController after HTTP message creation to sync real-time clients
  broadcastMessage(conversationId: string, message: unknown) {
    this.server.to(conversationId).emit('message', message);
  }
}
