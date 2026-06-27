import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type OtpEmailType = 'verification' | 'reset';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = config.get<string>('app.smtpHost');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('app.smtpPort', 587),
        secure: config.get<boolean>('app.smtpSecure', false),
        auth: {
          user: config.get<string>('app.smtpUser'),
          pass: config.get<string>('app.smtpPass'),
        },
      });
    }
  }

  async sendOtp(to: string, code: string, type: OtpEmailType): Promise<void> {
    const isDev = this.config.get<string>('app.nodeEnv') !== 'production';

    const subject =
      type === 'verification'
        ? 'Verifică-ți adresa de email — AlegoMind'
        : 'Resetare parolă — AlegoMind';

    const body =
      type === 'verification'
        ? this.verificationTemplate(code)
        : this.resetTemplate(code);

    // Always log in non-production so local dev works without SMTP
    if (isDev) {
      this.logger.log(
        `\n${'─'.repeat(50)}\n📧  ${subject}\n    To: ${to}\n    Code: ${code}\n${'─'.repeat(50)}`,
      );
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.get<string>('app.smtpFrom'),
          to,
          subject,
          text: body,
          html: this.wrapHtml(subject, body),
        });
      } catch (err) {
        this.logger.error(`Failed to send email to ${to}`, err);
        // In production, propagate the error so the caller knows
        if (!isDev) throw new InternalServerErrorException('Could not send email');
      }
    }
  }

  private verificationTemplate(code: string): string {
    return [
      'Bun venit pe AlegoMind!',
      '',
      'Codul tău de verificare a adresei de email este:',
      '',
      `    ${code}`,
      '',
      'Codul expiră în 10 minute.',
      'Dacă nu tu ai creat acest cont, ignoră acest email.',
      '',
      'Echipa AlegoMind',
    ].join('\n');
  }

  private resetTemplate(code: string): string {
    return [
      'Ai solicitat resetarea parolei pe AlegoMind.',
      '',
      'Codul tău de resetare este:',
      '',
      `    ${code}`,
      '',
      'Codul expiră în 10 minute.',
      'Dacă nu ai solicitat resetarea parolei, ignoră acest email — parola ta rămâne neschimbată.',
      '',
      'Echipa AlegoMind',
    ].join('\n');
  }

  private wrapHtml(subject: string, text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
<h2 style="color:#4F46E5">${subject}</h2>
<p>${escaped}</p>
</body></html>`;
  }
}
