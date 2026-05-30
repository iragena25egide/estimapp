import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTemplateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  defaultRate?: number;

  @IsOptional()
  order?: number;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateTaskDto)
  tasks: CreateTemplateTaskDto[];
}
