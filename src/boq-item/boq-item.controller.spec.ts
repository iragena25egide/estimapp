import { Test, TestingModule } from '@nestjs/testing';
import { BoqItemController } from './boq-item.controller';

describe('BoqItemController', () => {
  let controller: BoqItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoqItemController],
    }).compile();

    controller = module.get<BoqItemController>(BoqItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
