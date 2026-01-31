import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentCostController } from './equipment-cost.controller';

describe('EquipmentCostController', () => {
  let controller: EquipmentCostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentCostController],
    }).compile();

    controller = module.get<EquipmentCostController>(EquipmentCostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
