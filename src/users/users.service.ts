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
<div style="background:#f1f5f9;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
  <div style="
    max-width:520px;
    margin:auto;
    background:#ffffff;
    border-radius:10px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <div style="
      background:linear-gradient(135deg,#2563eb,#1e40af);
      color:#ffffff;
      padding:26px;
      text-align:center;
    ">
      <div style="font-size:24px;font-weight:bold;letter-spacing:0.5px;">
        estimAPP
      </div>
      <div style="font-size:14px;opacity:0.9;margin-top:6px;">
        Secure Login Verification
      </div>
    </div>

    <!-- Body -->
    <div style="padding:30px;color:#1f2937;font-size:15px;line-height:1.7;">
      <p style="margin-top:0;">
        Hello <strong>${dto.firstName || 'there'}</strong>,
      </p>

      <p>
        You requested a one-time password (OTP) to access your
        <strong>estima App</strong> account.
      </p>

      <!-- OTP Box -->
      <div style="
        text-align:center;
        margin:35px 0;
      ">
        <div style="
          display:inline-block;
          background:#eff6ff;
          border:1px solid #bfdbfe;
          color:#1d4ed8;
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          padding:18px 34px;
          border-radius:10px;
        ">
          ${otp}
        </div>
      </div>

      <p style="text-align:center;font-size:14px;color:#374151;">
        This code will expire in <strong>5 minutes</strong>.
      </p>

      <p style="
        background:#fef2f2;
        border-left:4px solid #dc2626;
        padding:12px 14px;
        font-size:13px;
        color:#7f1d1d;
        border-radius:6px;
        margin:24px 0;
      ">
         If you did not request this OTP, please ignore this email.
      </p>

      <p>
        Regards,<br />
        <strong>The estimAPP Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="
      background:#f8fafc;
      padding:14px;
      text-align:center;
      font-size:12px;
      color:#64748b;
    ">
      © ${new Date().getFullYear()} estimAPP · All rights reserved
    </div>

  </div>
</div>
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
