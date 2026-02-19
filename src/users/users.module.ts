import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../emails/email.service'; 
import { EmailsModule } from 'src/emails/emails.module';
import { NotificationsModule } from '../auth/notification.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule, 
    EmailsModule
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
