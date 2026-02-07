import { IsString, IsNumber } from 'class-validator';

export class CreateRateAnalysisDto {
  @IsString() projectId: string;
  @IsString() boqItemNo: string;
  @IsString() description: string;
  @IsString() unit: string;
  @IsNumber() materialCost: number;
  @IsNumber() laborCost: number;
  @IsNumber() equipmentCost: number;
  @IsNumber() wastage: number;
  @IsNumber() overheads: number;
  @IsNumber() profitPercent: number;
  @IsNumber() finalUnitRate: number;
}


