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

  async notifyAdminActivity(userId: string, actionDescription: string, details?: any) {
    let actorName = 'System';
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      actorName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown User';
    }

    const payload = {
      actorName,
      actionDescription,
      timestamp: new Date().toISOString(),
      details: details || {},
    };

    if (this.gateway.server) {
      // Emit live to online admins
      this.gateway.emitToRole('ADMIN', 'admin_activity_notification', payload);
    }
  }
}
