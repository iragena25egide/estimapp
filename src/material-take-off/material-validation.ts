// src/material/dto/create-mto.dto.ts
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateMaterialTakeOffDto {
  @IsString() projectId: string;
  @IsOptional() @IsString() boqItemId?: string;
  @IsString() materialName: string;
  @IsOptional() @IsString() specification?: string;
  @IsString() unit: string;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() deliveryLocation?: string;
  @IsOptional() @IsDateString() requiredDate?: string;
}

