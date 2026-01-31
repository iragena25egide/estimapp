import { Module } from '@nestjs/common';
import { BoqItemService } from './boq-item.service';
import { BoqItemController } from './boq-item.controller';

@Module({
  providers: [BoqItemService],
  controllers: [BoqItemController]
})
export class BoqItemModule {}
