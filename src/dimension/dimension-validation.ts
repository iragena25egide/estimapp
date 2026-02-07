// src/dimension/dto/create-dimension.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateDimensionSheetDto {
  @IsString() drawingId: string;
  @IsString() code: string;
  @IsString() description: string;
  @IsString() unit: string;
  @IsNumber() rate: number;
  @IsNumber() quantity: number;
  @IsNumber() total: number;
  @IsOptional() @IsNumber() length?: number;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
}


