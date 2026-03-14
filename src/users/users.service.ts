import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { NotificationsService } from 'src/auth/notification.service';
import { EmailService } from 'src/emails/email.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService,
    private emailService: EmailService,
  ) {}

  
  private signupOtpStore = new Map<
    string,
    {
      otp: string;
      expires: Date;
      data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        role: Role;
      };
    }
  >();

  
  async startSignup(dto: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role?: Role;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); 

    this.signupOtpStore.set(dto.email, {
      otp,
      expires,
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        role: dto.role ?? Role.ESTIMATOR,
      },
    });

   await this.emailService.sendEmail({
  to: dto.email,
  subject: 'estimAPP || Verify Your Email',
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 20px 40px -10px rgba(0,0,0,0.15);">
    
    <!-- Header with app gradient -->
    <div style="background:linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding:32px 24px; text-align:center;">
      <div style="font-size:28px; font-weight:700; color:#ffffff; letter-spacing:-0.5px; margin-bottom:4px;">estimAPP</div>
      <div style="font-size:15px; color:#e0e7ff; font-weight:400;">Secure Login Verification</div>
    </div>

    <!-- Main content -->
    <div style="padding:32px 28px; color:#1f2937;">
      <p style="margin-top:0; font-size:16px; line-height:1.6;">
        Hello <strong style="color:#2563eb;">${dto.firstName || 'there'}</strong>,
      </p>
      <p style="font-size:16px; line-height:1.6; margin:20px 0;">
        You requested a one‑time password (OTP) to access your estimAPP account. Use the code below to complete your login.
      </p>

      <!-- OTP card -->
      <div style="background:#f8fafc; border-radius:16px; padding:28px 20px; margin:28px 0; text-align:center; border:1px solid #e2e8f0;">
        <div style="font-size:14px; font-weight:500; color:#64748b; letter-spacing:0.5px; margin-bottom:12px;">YOUR VERIFICATION CODE</div>
        <div style="font-size:44px; font-weight:700; color:#2563eb; letter-spacing:8px; background:#ffffff; padding:16px 24px; display:inline-block; border-radius:12px; box-shadow:0 4px 10px rgba(37,99,235,0.1); border:1px solid #bfdbfe;">
          ${otp}
        </div>
        <div style="margin-top:18px; font-size:14px; color:#475569;">
          This code will expire in <strong style="color:#2563eb;">5 minutes</strong>.
        </div>
      </div>

      <!-- Security notice -->
      <div style="background:#fff7ed; border-left:4px solid #f97316; padding:16px 18px; border-radius:12px; margin:28px 0; font-size:14px; color:#7b341e;">
        <strong style="display:block; margin-bottom:6px; color:#c2410c;"> Did not request this?</strong>
        If you didn't ask for this OTP, you can safely ignore this email. Someone may have typed your email by mistake.
      </div>

      <p style="font-size:16px; line-height:1.6; margin:24px 0 12px;">
        Regards,<br />
        <strong style="color:#2563eb;">The estimAPP Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:18px 24px; text-align:center; border-top:1px solid #e5e7eb;">
      <p style="margin:0; font-size:13px; color:#6b7280;">
        © ${new Date().getFullYear()} estimAPP · All rights reserved
      </p>
      <p style="margin:6px 0 0; font-size:12px; color:#9ca3af;">
        This is an automated message, please do not reply.
      </p>
    </div>

  </div>
</body>
</html>
  `,
});

    return { message: 'Verification code sent to email' };
  }

  
  async verifySignupOtp(email: string, otp: string) {
    const record = this.signupOtpStore.get(email);

    if (!record) {
      throw new BadRequestException('No signup request found');
    }

    if (record.expires < new Date()) {
      this.signupOtpStore.delete(email);
      throw new BadRequestException('OTP expired');
    }

    if (record.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    return { message: 'Email verified successfully' };
  }

 
  async completeSignup(email: string, password: string) {
    const record = this.signupOtpStore.get(email);

    if (!record) {
      throw new BadRequestException('Email not verified');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: record.data.firstName,
        lastName: record.data.lastName,
        email: record.data.email,
        phone: record.data.phone ?? null,
        role: record.data.role,
        isActive: true,
        localAuth: {
          create: {
            password: hashedPassword,
            verified: true,
          },
        },
      },
      include: {
        localAuth: true,
        googleAuth: true,
      },
    });

    this.signupOtpStore.delete(email);

    if (user.role === Role.ESTIMATOR) {
      await this.notificationService.notifyAdminQSRegistered(user);
    }

    return user;
  }

  

  async countUsers() {
    return this.prisma.user.count();
  }

  async findByEmail(email: string) {
    if (!email) {
      throw new Error('Email is required for findByEmail');
    }

    return this.prisma.user.findUnique({
      where: { email },
      include: { localAuth: true, googleAuth: true },
    });
  }

  async findByEmailOrFail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        localAuth: true,
        googleAuth: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        localAuth: true,
        googleAuth: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  

  async createGoogleUser(
    email: string,
    firstName: string,
    lastName: string,
    googleId: string,
    avatarUrl?: string,
  ) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { googleAuth: true, localAuth: true },
    });

    if (user) {
      if (!user.googleAuth || user.googleAuth.googleId !== googleId) {
        user = await this.createOrUpdateGoogleAuth(
          user.id,
          googleId,
          avatarUrl,
        );
      }
      return user;
    }

    user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role: Role.ESTIMATOR,
        googleAuth: {
          create: { googleId, avatarUrl },
        },
      },
      include: { googleAuth: true, localAuth: true },
    });

    await this.notificationService.notifyAdminQSRegistered(user);

    return user;
  }

  async createOrUpdateGoogleAuth(
    userId: string,
    googleId: string,
    avatarUrl?: string,
  ) {
    const googleAuth = await this.prisma.googleAuth.findUnique({
      where: { userId },
    });

    if (googleAuth) {
      await this.prisma.googleAuth.update({
        where: { userId },
        data: { googleId, avatarUrl },
      });
    } else {
      await this.prisma.googleAuth.create({
        data: { userId, googleId, avatarUrl },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { googleAuth: true, localAuth: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        localAuth: true,
        googleAuth: true,
      },
    });
  }
}
