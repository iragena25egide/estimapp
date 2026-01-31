import { Module } from '@nestjs/common';
import { NotificationsService } from './notification.service';
import { NotificationsGateway } from './notification.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
