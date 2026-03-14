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
        Hello <strong style="color:#2563eb;">${user.firstName || 'there'}</strong>,
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
      process.env.SECRET_KEY || 'secretkey',
      { expiresIn: '1d' },
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
    process.env.SECRET_KEY || 'secretkey',
    { expiresIn: '6h' }
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