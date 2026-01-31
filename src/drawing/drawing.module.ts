import { Module } from '@nestjs/common';
import { DrawingService } from './drawing.service';
import { DrawingController } from './drawing.controller';

@Module({
  providers: [DrawingService],
  controllers: [DrawingController]
})
export class DrawingModule {}
