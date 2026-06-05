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

    // Save to DB so it can be fetched later
    const notif = await this.prisma.notification.create({
      data: {
        type: 'QS_REGISTERED', // reusing this type or could add a new one in schema, actually let's stick to existing
        recipientRole: 'ADMIN',
        payload,
      },
    });

    if (this.gateway.server) {
      // Emit live to online admins
      this.gateway.emitToRole('ADMIN', 'admin_activity_notification', { id: notif.id, ...payload, isRead: false, createdAt: notif.createdAt });
    }
  }

  async getUserNotifications(role: string) {
    // Only get notifications meant for this role
    return this.prisma.notification.findMany({
      where: { recipientRole: role as any },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(role: string) {
    return this.prisma.notification.updateMany({
      where: { recipientRole: role as any, isRead: false },
      data: { isRead: true },
    });
  }
}
