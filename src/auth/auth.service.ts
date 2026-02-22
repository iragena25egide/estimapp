import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { EmailService } from 'src/emails/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from './notification.service';


@Injectable()
export class AuthService {
  private otpStore = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private emailService: EmailService,
    private notificationService: NotificationsService,
  ) {}

  
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrFail(dto.email);

    if (!user.localAuth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.localAuth.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(user.email, otp);

    await this.emailService.sendEmail({
  to: user.email,
  subject: 'estimAPP || Your Login OTP',
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
        Hello <strong>${user.firstName || 'there'}</strong>,
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
        ⚠️ If you did not request this OTP, please ignore this email.
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


    return { message: 'OTP sent to your email' };
  }

 
  async verifyOtp(email: string, otp: string) {
    const storedOtp = this.otpStore.get(email);
    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.usersService.findByEmailOrFail(email);

    this.otpStore.delete(email);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' },
    );

    return { token };
  }

  
async loginOrRegisterGoogle({
  email,
  firstName,
  lastName,
  googleId,
  avatarUrl,
}: {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  avatarUrl?: string;
}) {
  let user = await this.usersService.findByEmail(email);

  if (user) {
   
    if (!user.googleAuth || user.googleAuth.googleId !== googleId) {
      user = await this.usersService.createOrUpdateGoogleAuth(user.id, googleId, avatarUrl);
    }
  } else {

    user = await this.usersService.createGoogleUser(email, firstName, lastName, googleId, avatarUrl);

    
    // if (user.role === 'QS') {
    //   await this.notificationService.notifyAdminQSRegistered(user);
    // }
  }

  if (!user) throw new Error('Failed to create or retrieve user');

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '1h' }
  );

  return { user, token };
}

async getMe(token: string) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY || 'secretkey',
    ) as { id: string; email: string; role: string };

    const user = await this.usersService.findByEmailOrFail(decoded.email);

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      avatar: user.googleAuth?.avatarUrl || null,
      lastLogin: user.updatedAt,
    };
  } catch (error) {
    throw new UnauthorizedException('Invalid or expired token');
  }
}


}