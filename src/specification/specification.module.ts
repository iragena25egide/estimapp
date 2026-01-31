import { Module } from '@nestjs/common';
import { SpecificationService } from './specification.service';
import { SpecificationController } from './specification.controller';

@Module({
  providers: [SpecificationService],
  controllers: [SpecificationController]
})
export class SpecificationModule {}
