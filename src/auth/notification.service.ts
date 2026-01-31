import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async notifyAdminQSRegistered(qsUser: any) {
    if (!qsUser) return;

    const payload = {
      qsId: qsUser.id,
      email: qsUser.email,
      name: `${qsUser.firstName ?? ''} ${qsUser.lastName ?? ''}`.trim(),
    };

    
    if (this.gateway.isRoleOnline('ADMIN')) {
      this.gateway.emitToRole('ADMIN', 'qs_registered', payload);
      return;
    }

    
    await this.prisma.notification.create({
      data: {
        type: 'QS_REGISTERED',
        recipientRole: 'ADMIN',
        payload,
      },
    });
  }
}
