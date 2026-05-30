import { Module } from '@nestjs/common';
import { RateLibraryService } from './rate-library.service';
import { RateLibraryController } from './rate-library.controller';

@Module({
  providers: [RateLibraryService],
  controllers: [RateLibraryController],
  exports: [RateLibraryService],
})
export class RateLibraryModule {}
