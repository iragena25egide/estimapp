import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; 
import { EmailService } from '../emails/email.service'; 
import { EmailsModule } from 'src/emails/emails.module';
import { GoogleStrategy } from './strategy/google.strategy';
import { NotificationsModule } from './notification.module';


@Module({
  imports: [UsersModule,EmailsModule,NotificationsModule], 
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}
