import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);

    if (host && user && password) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass: password },
      });
    } else if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error(
        'SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are required in production.',
      );
    } else {
      this.logger.warn(
        'SMTP is not configured. Password-reset emails will not be delivered.',
      );
    }
  }

  async sendPasswordResetEmail(input: {
    email: string;
    name?: string;
    token: string;
    expiresMinutes: number;
  }) {
    if (!this.transporter) throw new Error('SMTP is not configured.');

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      this.configService.get<string>('ALLOWED_URL') ??
      'http://localhost:3000';
    const resetUrl = new URL('/web/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', input.token);
    const safeName = this.escapeHtml(input.name?.trim() || 'there');
    const safeResetUrl = this.escapeHtml(resetUrl.toString());

    await this.transporter.sendMail({
      from:
        this.configService.get<string>('MAIL_FROM') ??
        this.configService.getOrThrow<string>('SMTP_USER'),
      to: input.email,
      subject: 'Password reset requested',
      text: `Hello ${input.name?.trim() || 'there'},\n\nReset your password using this link: ${resetUrl.toString()}\n\nThis link expires in ${input.expiresMinutes} minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717">
          <h2>Password reset requested</h2>
          <p>Hello ${safeName},</p>
          <p>Use the secure link below to choose a new password.</p>
          <p><a href="${safeResetUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#171717;color:#fff;text-decoration:none">Reset Password</a></p>
          <p>This link expires in ${input.expiresMinutes} minutes and can only be used once.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  private escapeHtml(value: string) {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[character] ?? character,
    );
  }
}
