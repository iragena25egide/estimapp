import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateDimensionSheetDto {
  @IsString() drawingId: string;
  @IsString() code: string;
  @IsString() description: string;
  @IsString() unit: string;
  @IsNumber() rate: number;
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsNumber() total?: number;
  @IsOptional() @IsNumber() length?: number;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() formula?: string;
}

export class UpdateDimensionSheetDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() rate?: number;
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsNumber() total?: number;
  @IsOptional() @IsNumber() length?: number;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() formula?: string;
}
