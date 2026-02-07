// src/equipment/dto/create-equipment.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateEquipmentDto {
  @IsString() projectId: string;
  @IsString() equipmentName: string;
  @IsOptional() @IsString() capacity?: string;
  @IsNumber() hireRatePerDay: number;
  @IsNumber() durationDays: number;
  @IsOptional() @IsNumber() fuelCost?: number;
  @IsOptional() @IsNumber() operatorCost?: number;
  @IsNumber() totalCost: number;
}

