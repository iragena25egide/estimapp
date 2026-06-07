import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_SPptQXmS_DZMv9MyL5kiz1fBStxSNtf2d');
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: { filename?: string; path: string }[];
  }) {
    try {
      // Free Resend accounts can only send from onboarding@resend.dev
      const info = await this.resend.emails.send({
        from: 'ESTIMATOR <onboarding@resend.dev>',
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || '',
      });
      console.log('Email sent via Resend:', info);
      return info;
    } catch (err) {
      console.error('Error sending email via Resend:', err);
      throw err;
    }
  }
}
