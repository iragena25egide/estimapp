import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';

@Module({
  providers: [ProjectService],
  controllers: [ProjectController]
})
export class ProjectsModule {}
