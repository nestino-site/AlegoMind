import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SenderType } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createConversation(seekerId: string, professionalId: string) {
    const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
    if (!professional) throw new NotFoundException('Professional not found');

    // Upsert — free initial contact, no duplicate conversations
    const existing = await this.prisma.conversation.findUnique({
      where: { seekerId_professionalId: { seekerId, professionalId } },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({ data: { seekerId, professionalId } });
  }

  async getMyConversations(seekerId: string) {
    return this.prisma.conversation.findMany({
      where: { seekerId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        professional: {
          include: { user: { select: { firstName: true, displayName: true, avatar: true } } },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    const conversation = await this.assertAccess(conversationId, userId);

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' }, // newest first; frontend reverses for display
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId: conversation.id } }),
    ]);

    return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    senderType: SenderType,
  ) {
    await this.assertAccess(conversationId, userId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId: userId, senderType, content },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  // Returns the conversation if userId is either the seeker or the professional's owner
  async assertAccess(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.seekerId === userId) return conversation;

    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (professional && professional.id === conversation.professionalId) return conversation;

    throw new ForbiddenException('You do not have access to this conversation');
  }
}
