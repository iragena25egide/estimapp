import { Test, TestingModule } from '@nestjs/testing';
import { BoqItemService } from './boq-item.service';

describe('BoqItemService', () => {
  let service: BoqItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoqItemService],
    }).compile();

    service = module.get<BoqItemService>(BoqItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
