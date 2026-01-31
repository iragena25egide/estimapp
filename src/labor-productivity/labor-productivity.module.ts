import { Module } from '@nestjs/common';
import { LaborProductivityService } from './labor-productivity.service';
import { LaborProductivityController } from './labor-productivity.controller';

@Module({
  providers: [LaborProductivityService],
  controllers: [LaborProductivityController]
})
export class LaborProductivityModule {}
