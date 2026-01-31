import { Test, TestingModule } from '@nestjs/testing';
import { MaterialTakeOffService } from './material-take-off.service';

describe('MaterialTakeOffService', () => {
  let service: MaterialTakeOffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialTakeOffService],
    }).compile();

    service = module.get<MaterialTakeOffService>(MaterialTakeOffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
