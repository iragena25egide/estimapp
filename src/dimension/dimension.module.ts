import { Module } from '@nestjs/common';
import { DimensionSheetService } from './dimension.service';
import {  DimensionSheetController } from './dimension.controller';

@Module({
  providers: [DimensionSheetService],
  controllers: [DimensionSheetController]
})
export class DimensionModule {}
