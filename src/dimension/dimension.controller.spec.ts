import { Test, TestingModule } from '@nestjs/testing';
import { DimensionController } from './dimension.controller';

describe('DimensionController', () => {
  let controller: DimensionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DimensionController],
    }).compile();

    controller = module.get<DimensionController>(DimensionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
