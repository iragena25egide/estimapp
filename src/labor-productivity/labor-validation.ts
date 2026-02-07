// src/labor/dto/create-labor.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class CreateLaborDto {
  @IsString() projectId: string;
  @IsString() trade: string;
  @IsString() activity: string;
  @IsNumber() productivityRate: number;
  @IsNumber() manHours: number;
  @IsNumber() laborRatePerHour: number;
  @IsNumber() totalLaborCost: number;
}


