import { Test, TestingModule } from '@nestjs/testing';
import { MaterialTakeOffController } from './material-take-off.controller';

describe('MaterialTakeOffController', () => {
  let controller: MaterialTakeOffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialTakeOffController],
    }).compile();

    controller = module.get<MaterialTakeOffController>(MaterialTakeOffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
