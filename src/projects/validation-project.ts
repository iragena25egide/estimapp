import { IsString, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { ContractType } from '@prisma/client';

export class CreateProjectDto {
  @IsString() name: string;
  @IsString() client: string;
  @IsOptional() @IsString() location?: string;
  @IsString() projectType: string;
  @IsEnum(ContractType) contractType: ContractType;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() completionDate?: string;
  @IsString() estimatorName: string;
  @IsOptional() @IsNumber() revisionNo?: number;
  @IsString() createdById: string;
}


