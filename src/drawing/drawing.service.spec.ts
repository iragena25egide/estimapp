import { Test, TestingModule } from '@nestjs/testing';
import { DrawingService } from './drawing.service';

describe('DrawingService', () => {
  let service: DrawingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DrawingService],
    }).compile();

    service = module.get<DrawingService>(DrawingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
