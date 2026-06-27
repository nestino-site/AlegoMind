import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const FREE_MATCH_LIMIT = 3;

interface MatchResult {
  professionalId: string;
  reason: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('app.anthropicApiKey') ?? '',
    });
  }

  async match(userId: string, userMessage: string) {
    // ── Rate limit check ─────────────────────────────────────────────────────────
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const isPlus = user.subscriptionTier === SubscriptionTier.PLUS;
    if (!isPlus && user.aiMatchCount >= FREE_MATCH_LIMIT) {
      throw new ForbiddenException(
        `Free tier includes ${FREE_MATCH_LIMIT} AI matches. Upgrade to Health Plus for unlimited access.`,
      );
    }

    // ── Load context ─────────────────────────────────────────────────────────────
    const [prefs, professionals] = await Promise.all([
      this.prisma.matchingPreference.findUnique({ where: { userId } }),
      this.prisma.professional.findMany({
        where: { isAvailable: true },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        take: 25,
        include: { user: { select: { displayName: true, firstName: true } } },
      }),
    ]);

    if (professionals.length === 0) {
      throw new BadRequestException('No professionals available at this time');
    }

    // ── Build prompt ─────────────────────────────────────────────────────────────
    const prefsSection = prefs
      ? [
          prefs.topics.length ? `Topics: ${prefs.topics.join(', ')}` : null,
          prefs.communicationFormats.length
            ? `Session formats: ${prefs.communicationFormats.join(', ')}`
            : null,
          prefs.providerGender ? `Provider gender preference: ${prefs.providerGender}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      : 'No saved preferences yet.';

    const profsSection = professionals
      .map(
        (p) =>
          `ID: ${p.id}\n` +
          `Name: ${p.user.displayName ?? p.user.firstName ?? 'Professional'}\n` +
          `Type: ${p.type}\n` +
          `Specializations: ${p.specializations.join(', ')}\n` +
          `Session formats: ${p.sessionFormats.join(', ')}\n` +
          `Languages: ${p.languages.join(', ')}\n` +
          `Price: ${p.pricePerSession} RON/session\n` +
          `Rating: ${p.rating.toFixed(1)}/5 (${p.reviewCount} reviews)`,
      )
      .join('\n\n');

    const systemPrompt =
      'You are an empathetic AI assistant for AlegoMind, a Romanian platform connecting people with coaches, mentors, and therapists. ' +
      'Your role is to match users with the most suitable mental health and personal development professionals based on their described situation.';

    const userPrompt =
      `A user described their situation:\n"${userMessage}"\n\n` +
      `Their saved preferences:\n${prefsSection}\n\n` +
      `Available professionals:\n${profsSection}\n\n` +
      `Select the top 3 professionals who best match this user's specific situation. ` +
      `For each match, explain in 2-3 sentences exactly why they are suited to help with what the user described — ` +
      `be specific about their specializations and how they address the user's needs.`;

    // ── Call Anthropic with tool_use for structured output ────────────────────────
    const apiKey = this.config.get<string>('app.anthropicApiKey');
    if (!apiKey) {
      throw new BadRequestException('AI service is not configured on this server');
    }

    let matches: MatchResult[];
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools: [
          {
            name: 'return_matches',
            description: 'Return the top 3 ranked professional matches for the user',
            input_schema: {
              type: 'object' as const,
              properties: {
                matches: {
                  type: 'array',
                  maxItems: 3,
                  items: {
                    type: 'object',
                    properties: {
                      professionalId: {
                        type: 'string',
                        description: 'Exact professional ID from the list',
                      },
                      reason: {
                        type: 'string',
                        description:
                          '2-3 sentence explanation of why this professional is a good match for the user\'s specific situation',
                      },
                    },
                    required: ['professionalId', 'reason'],
                  },
                },
              },
              required: ['matches'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'return_matches' },
        messages: [{ role: 'user', content: userPrompt }],
      });

      const toolUse = response.content[0] as Anthropic.ToolUseBlock;
      const toolInput = toolUse.input as { matches: MatchResult[] };
      matches = toolInput.matches ?? [];
    } catch (err: any) {
      this.logger.error(`Anthropic API error: ${err.message}`);
      throw new BadRequestException('AI matching service is temporarily unavailable');
    }

    // ── Increment usage counter ──────────────────────────────────────────────────
    await this.prisma.user.update({
      where: { id: userId },
      data: { aiMatchCount: { increment: 1 } },
    });

    // ── Enrich matches with full professional data ────────────────────────────────
    const profMap = new Map(professionals.map((p) => [p.id, p]));

    const enriched = matches
      .map((m) => {
        const prof = profMap.get(m.professionalId);
        if (!prof) return null;
        return { professional: prof, reason: m.reason };
      })
      .filter(Boolean);

    return {
      matches: enriched,
      usageCount: user.aiMatchCount + 1,
      remainingFreeMatches: isPlus ? null : Math.max(0, FREE_MATCH_LIMIT - user.aiMatchCount - 1),
    };
  }
}
