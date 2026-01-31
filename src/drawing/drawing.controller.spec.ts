import { Test, TestingModule } from '@nestjs/testing';
import { DrawingController } from './drawing.controller';

describe('DrawingController', () => {
  let controller: DrawingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DrawingController],
    }).compile();

    controller = module.get<DrawingController>(DrawingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
