
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateBoqItemDto {
  @IsString() projectId: string;
  @IsString() itemNo: string;
  @IsString() description: string;
  @IsString() unit: string;
  @IsNumber() quantity: number;
  @IsNumber() materialRate: number;
  @IsNumber() laborRate: number;
  @IsNumber() equipmentRate: number;
  @IsNumber() totalRate: number;
  @IsNumber() amount: number;
  @IsOptional() @IsString() section?: string;
}

// // src/boq/dto/update-boq-item.dto.ts
// import { PartialType } from '@nestjs/mapped-types';
// import { CreateBoqItemDto } from './create-boq-item.dto';

// export class UpdateBoqItemDto extends PartialType(CreateBoqItemDto) {}
