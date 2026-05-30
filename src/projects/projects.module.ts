import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';
import { NotificationsModule } from '../auth/notification.module';

@Module({
  imports: [NotificationsModule],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectsModule {}
