import { Test, TestingModule } from '@nestjs/testing';
import { LaborProductivityService } from './labor-productivity.service';

describe('LaborProductivityService', () => {
  let service: LaborProductivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LaborProductivityService],
    }).compile();

    service = module.get<LaborProductivityService>(LaborProductivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
