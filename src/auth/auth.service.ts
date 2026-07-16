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
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please use "Continue with Google".',
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.localAuth.password);
    if (!isValid) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    // ── OTP DISABLED FOR TESTING ─────────────────────────────────────────
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // this.otpStore.set(user.email, otp);
    // try {
    //   await this.emailService.sendEmail({ ... OTP email ... });
    // } catch (emailError: any) {
    //   console.error('Email sending failed:', emailError.message);
    // }
    // return { message: 'OTP sent to your email (or use master OTP 000000)' };
    // ──────────────────────────────────────────────────────────────────────

    // Issue JWT directly — re-enable OTP block above when done testing
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.SECRET_KEY || 'secretkey',
      { expiresIn: '1d' },
    );
    return { token };
  }

async verifyOtp(email: string, otp: string) {
  const storedOtp = this.otpStore.get(email);
  
  // Accept the real OTP or the master testing OTP '000000'
  if (otp !== '000000' && (!storedOtp || storedOtp !== otp)) {
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
      firstName: user.firstName,
      lastName: user.lastName,
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