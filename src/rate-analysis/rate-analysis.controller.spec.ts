import { Test, TestingModule } from '@nestjs/testing';
import { RateAnalysisController } from './rate-analysis.controller';

describe('RateAnalysisController', () => {
  let controller: RateAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateAnalysisController],
    }).compile();

    controller = module.get<RateAnalysisController>(RateAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
