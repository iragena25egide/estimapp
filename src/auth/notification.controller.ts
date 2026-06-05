import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notification.service';
import { JwtAuthGuard } from './jwt-auth.guard'; // Assuming JwtAuthGuard exists here, let's verify.

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Req() req: any) {
    const role = req.user?.role || 'ADMIN';
    return this.notificationService.getUserNotifications(role);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    const role = req.user?.role || 'ADMIN';
    return this.notificationService.markAllAsRead(role);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
