import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment-cost.service';
import { EquipmentCostController } from './equipment-cost.controller';

@Module({
  providers: [EquipmentService],
  controllers: [EquipmentCostController]
})
export class EquipmentCostModule {}
