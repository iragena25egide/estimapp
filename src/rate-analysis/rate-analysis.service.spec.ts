import { Test, TestingModule } from '@nestjs/testing';
import { RateAnalysisService } from './rate-analysis.service';

describe('RateAnalysisService', () => {
  let service: RateAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateAnalysisService],
    }).compile();

    service = module.get<RateAnalysisService>(RateAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
