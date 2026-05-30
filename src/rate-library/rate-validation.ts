import { IsString, IsNumber } from 'class-validator';

export class CreateRateItemDto {
  @IsString() code: string;
  @IsString() description: string;
  @IsString() unit: string;
  @IsNumber() rate: number;
}
