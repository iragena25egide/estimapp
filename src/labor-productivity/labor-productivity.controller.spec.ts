import { Test, TestingModule } from '@nestjs/testing';
import { LaborProductivityController } from './labor-productivity.controller';

describe('LaborProductivityController', () => {
  let controller: LaborProductivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LaborProductivityController],
    }).compile();

    controller = module.get<LaborProductivityController>(LaborProductivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
