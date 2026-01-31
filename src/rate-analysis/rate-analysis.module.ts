import { Module } from '@nestjs/common';
import { RateAnalysisService } from './rate-analysis.service';
import { RateAnalysisController } from './rate-analysis.controller';

@Module({
  providers: [RateAnalysisService],
  controllers: [RateAnalysisController]
})
export class RateAnalysisModule {}
