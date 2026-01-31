import { Module } from '@nestjs/common';
import { EquipmentCostService } from './equipment-cost.service';
import { EquipmentCostController } from './equipment-cost.controller';

@Module({
  providers: [EquipmentCostService],
  controllers: [EquipmentCostController]
})
export class EquipmentCostModule {}
