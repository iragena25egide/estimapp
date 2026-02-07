import { Discipline } from '@prisma/client';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSpecificationDto {
  @IsString()
  projectId: string;

  @IsString()
  specSection: string;

  @IsString()
  description: string;

  @IsEnum(Discipline)
  discipline: Discipline;

  @IsString()
  revision: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
