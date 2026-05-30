import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { RateLibraryService } from './rate-library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('estimaApp/rate-library')
@UseGuards(JwtAuthGuard)
export class RateLibraryController {
  constructor(private readonly service: RateLibraryService) {}

  @Post('import')
  importCSV(@Body('csv') csv: string) {
    return this.service.importCSV(csv);
  }

  @Get('lookup')
  lookup(@Query('q') query: string) {
    return this.service.lookup(query);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
