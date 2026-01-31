import { Module } from '@nestjs/common';
import { MaterialTakeOffService } from './material-take-off.service';
import { MaterialTakeOffController } from './material-take-off.controller';

@Module({
  providers: [MaterialTakeOffService],
  controllers: [MaterialTakeOffController]
})
export class MaterialTakeOffModule {}
