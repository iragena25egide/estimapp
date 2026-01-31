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
    <div style="background:#f4f6f8;padding:30px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:480px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;">
        
        <div style="background:#1e293b;color:#ffffff;padding:20px;text-align:center;
                    font-size:22px;font-weight:bold;">
          estimAPP
        </div>

        <div style="padding:25px;color:#333333;font-size:15px;line-height:1.6;">
          <p>Hello ${user.firstName || 'there'},</p>

          <p>
            Use the OTP below to log in to your <strong>estimAPP</strong> account.
          </p>

          <div style="text-align:center;margin:30px 0;">
            <span style="
              display:inline-block;
              background:#f1f5f9;
              border:2px dashed #1e293b;
              color:#1e293b;
              font-size:28px;
              font-weight:bold;
              letter-spacing:6px;
              padding:14px 26px;
              border-radius:6px;
            ">
              ${otp}
            </span>
          </div>

          <p>
            This OTP will expire in <strong>5 minutes</strong>.
            Do not share it with anyone.
          </p>

          <p style="color:#dc2626;font-size:13px;">
            If you did not request this login, please ignore this email.
          </p>

          <p>
            Regards,<br />
            <strong>estimAPP Team</strong>
          </p>
        </div>

        <div style="background:#f8fafc;padding:12px;text-align:center;
                    font-size:12px;color:#64748b;">
          © ${new Date().getFullYear()} estimAPP
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


}