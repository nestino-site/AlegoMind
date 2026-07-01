import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookingStatus,
  ConversationStatus,
  ConversationTopicType,
  ProfessionalType,
  SenderType,
  SubscriptionTier,
} from '@prisma/client';
import { StripeService } from '../stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { SelectTopicDto, TopicType } from './dto/select-topic.dto';

const WELCOME_TEMPLATES: Record<ProfessionalType, string> = {
  THERAPIST:
    'Buna ziua! Sunt incantata sa ne intalnim. Pentru a incepe conversatia, te rog sa alegi un subiect de mai jos:',
  COACH:
    'Salut! Sunt aici si astept sa lucram impreuna. Ce te-a adus astazi? Alege un subiect pentru a incepe:',
  MENTOR:
    'Buna! Iti multumesc pentru mesaj. Ce directie vrei sa exploram impreuna? Alege un subiect de mai jos:',
};

@Injectable()
export class MessagesService {
  private readonly anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('app.anthropicApiKey') ?? '',
    });
  }

  // ── Conversations ────────────────────────────────────────────────────────────

  async createConversation(seekerId: string, professionalId: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        user: {
          select: { id: true, subscriptionTier: true, displayName: true, firstName: true },
        },
      },
    });
    if (!professional) throw new NotFoundException('Professional not found');

    const existing = await this.prisma.conversation.findUnique({
      where: { seekerId_professionalId: { seekerId, professionalId } },
      include: {
        professional: {
          include: { user: { select: { firstName: true, displayName: true, avatar: true } } },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
    if (existing) return existing;

    const seeker = await this.prisma.user.findUniqueOrThrow({ where: { id: seekerId } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customWelcome = (professional as any).welcomeMessage as string | null | undefined;
    let welcomeText = customWelcome || WELCOME_TEMPLATES[professional.type];

    // Only use AI-generated welcome for PLUS seekers when the professional hasn't set a custom message
    if (seeker.subscriptionTier === SubscriptionTier.PLUS && !customWelcome) {
      try {
        const proName =
          professional.user?.displayName ?? professional.user?.firstName ?? 'profesionist';
        const resp = await this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          messages: [
            {
              role: 'user',
              content: `You are ${proName}, a ${professional.type.toLowerCase()} on a Romanian mental health platform. Write a short, warm welcome message (2-3 sentences, in Romanian) for a new client starting a chat with you. End by inviting them to select a topic. Keep it personal and professional.`,
            },
          ],
        });
        if (resp.content[0].type === 'text') {
          welcomeText = resp.content[0].text.trim();
        }
      } catch {
        // fall back to template on AI error
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        seekerId,
        professionalId,
        messages: {
          create: {
            senderId: professional.user.id,
            senderType: SenderType.PROFESSIONAL,
            content: welcomeText,
          },
        },
      },
      include: {
        professional: {
          include: { user: { select: { firstName: true, displayName: true, avatar: true } } },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    return conversation;
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

  async getProConversations(userId: string) {
    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) return [];

    return this.prisma.conversation.findMany({
      where: { professionalId: professional.id },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        seeker: { select: { firstName: true, displayName: true, avatar: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // ── Conversation options ─────────────────────────────────────────────────────

  async getConversationOptions(conversationId: string, seekerId: string) {
    const conv = await this.assertAccess(conversationId, seekerId);

    const [upcomingBooking, chatServices] = await Promise.all([
      this.prisma.booking.findFirst({
        where: {
          seekerId,
          professionalId: conv.professionalId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.chatService.findMany({
        where: { professionalId: conv.professionalId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // price=0 services are treated as free options; price>0 require payment
    const freeOptions: { id?: string; label: string; description?: string | null; price: 0; type: 'FREE' }[] = [];
    const paidOptions: { id: string; label: string; description?: string | null; price: number; type: 'PAID' }[] = [];

    for (const s of chatServices) {
      if (s.price === 0) {
        freeOptions.push({ id: s.id, label: s.name, description: s.description, price: 0, type: 'FREE' });
      } else {
        paidOptions.push({ id: s.id, label: s.name, description: s.description, price: s.price, type: 'PAID' });
      }
    }

    // Booking-based free option appears only if no price=0 service already covers it
    if (upcomingBooking && freeOptions.length === 0) {
      freeOptions.unshift({ label: 'Intrebare despre sedinta rezervata', price: 0, type: 'FREE' });
    }

    return {
      freeOptions,
      paidOptions,
      conversationStatus: conv.status,
      topicLabel: conv.topicLabel,
      topicType: conv.topicType,
      topicCost: conv.topicCost,
    };
  }

  // ── Topic selection ──────────────────────────────────────────────────────────

  async selectTopic(conversationId: string, seekerId: string, dto: SelectTopicDto) {
    const conv = await this.assertAccess(conversationId, seekerId);
    if (conv.status === ConversationStatus.ACTIVE) {
      throw new BadRequestException('Conversation already has an active topic');
    }

    if (dto.topicType === TopicType.FREE) {
      const updated = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.ACTIVE,
          topicLabel: dto.topicLabel,
          topicType: ConversationTopicType.FREE,
          topicCost: 0,
        },
        include: { professional: { include: { user: { select: { id: true } } } } },
      });

      const responseMsg = await this.sendTopicResponseMessage(
        conversationId,
        updated.professional.user.id,
        dto.topicLabel,
        updated.professional.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updated.professional as any).topicResponseTemplate,
      );

      return { status: 'ACTIVE', message: responseMsg };
    }

    // PAID
    if (!dto.price || dto.price <= 0) {
      throw new BadRequestException('Price is required for paid topics');
    }

    const bypass = Boolean(this.config.get('app.bypassPayment'));
    if (bypass) {
      const updated = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.ACTIVE,
          topicLabel: dto.topicLabel,
          topicType: ConversationTopicType.PAID,
          topicCost: dto.price,
          topicPaymentIntentId: `bypass_${Date.now()}`,
        },
        include: { professional: { include: { user: { select: { id: true } } } } },
      });

      const responseMsg = await this.sendTopicResponseMessage(
        conversationId,
        updated.professional.user.id,
        dto.topicLabel,
        updated.professional.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updated.professional as any).topicResponseTemplate,
      );

      return { status: 'ACTIVE', clientSecret: null, message: responseMsg };
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(dto.price, {
      conversationId,
      topicLabel: dto.topicLabel,
      seekerId,
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { topicPaymentIntentId: paymentIntent.id },
    });

    return { status: 'PENDING_PAYMENT', clientSecret: paymentIntent.client_secret };
  }

  async confirmTopicPayment(conversationId: string, seekerId: string, paymentIntentId: string) {
    const conv = await this.assertAccess(conversationId, seekerId);

    if (conv.topicPaymentIntentId?.startsWith('bypass_')) {
      return { status: 'ACTIVE' };
    }

    const pi = await this.stripeService.retrievePaymentIntent(paymentIntentId);
    if (pi.status !== 'succeeded') {
      throw new BadRequestException('Payment has not succeeded');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.ACTIVE, topicType: ConversationTopicType.PAID },
      include: { professional: { include: { user: { select: { id: true } } } } },
    });

    const responseMsg = await this.sendTopicResponseMessage(
      conversationId,
      updated.professional.user.id,
      conv.topicLabel ?? 'serviciul ales',
      updated.professional.type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updated.professional as any).topicResponseTemplate,
    );

    return { status: 'ACTIVE', message: responseMsg };
  }

  // ── Messages ─────────────────────────────────────────────────────────────────

  async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    const conversation = await this.assertAccess(conversationId, userId);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId: conversation.id } }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conv = conversation as any;
    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      seekerLastReadAt: conv.seekerLastReadAt?.toISOString() ?? null,
      proLastReadAt: conv.proLastReadAt?.toISOString() ?? null,
    };
  }

  // ── Read receipts ────────────────────────────────────────────────────────────

  async markConversationRead(conversationId: string, userId: string) {
    const conv = await this.assertAccess(conversationId, userId);
    const isSeeker = conv.seekerId === userId;
    const readAt = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma.conversation as any).update({
      where: { id: conversationId },
      data: isSeeker ? { seekerLastReadAt: readAt } : { proLastReadAt: readAt },
    });
    return { readAt, isSeeker };
  }

  // ── Unread counts (actual per-message counts) ────────────────────────────────

  async getUnreadCounts(userId: string, readTimestamps: Record<string, string>) {
    const convIds = Object.keys(readTimestamps);
    if (!convIds.length) return {};

    const results = await Promise.all(
      convIds.map(async (convId) => {
        try {
          await this.assertAccess(convId, userId);
          const lr = readTimestamps[convId];
          const count = await this.prisma.message.count({
            where: {
              conversationId: convId,
              senderId: { not: userId },
              senderType: { not: SenderType.AI },
              ...(lr ? { createdAt: { gt: new Date(lr) } } : {}),
            },
          });
          return [convId, count] as const;
        } catch {
          return [convId, 0] as const;
        }
      }),
    );

    return Object.fromEntries(results);
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    senderType: SenderType,
  ) {
    const conv = await this.assertAccess(conversationId, userId);

    if (conv.status !== ConversationStatus.ACTIVE && conv.seekerId === userId) {
      throw new ForbiddenException('Please select a topic before sending messages');
    }

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

  // ── Internal helpers ─────────────────────────────────────────────────────────

  private async sendTopicResponseMessage(
    conversationId: string,
    professionalUserId: string,
    topicLabel: string,
    proType: ProfessionalType,
    customTemplate?: string | null,
  ) {
    let content: string;
    if (customTemplate) {
      content = customTemplate.replace(/\{topic\}/g, topicLabel);
    } else {
      const responses: Record<ProfessionalType, string> = {
        THERAPIST: `Multumesc ca ai ales sa vorbim despre "${topicLabel}". Sunt aici sa te ascult. Cu ce pot incepe sa te ajut?`,
        COACH: `Super alegere! Sa vorbim despre "${topicLabel}". Spune-mi mai multe — de unde vrei sa incepem?`,
        MENTOR: `Excelent! Referitor la "${topicLabel}" — hai sa vedem cum te pot ajuta cel mai bine. Ce ai incercat pana acum?`,
      };
      content = responses[proType];
    }

    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: professionalUserId,
        senderType: SenderType.PROFESSIONAL,
        content,
      },
    });
  }

  // ── End session (professional only) ─────────────────────────────────────────

  async endSession(conversationId: string, professionalUserId: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { userId: professionalUserId },
    });
    if (!professional) throw new ForbiddenException('Not a professional account');

    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.professionalId !== professional.id) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.PENDING_TOPIC,
        topicLabel: null,
        topicType: null,
        topicCost: null,
        topicPaymentIntentId: null,
      },
    });

    // System message visible to both sides
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: professionalUserId,
        senderType: SenderType.PROFESSIONAL,
        content: '— Sesiunea a fost încheiată. Alege un subiect nou pentru a continua. —',
      },
    });

    return { message };
  }

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
