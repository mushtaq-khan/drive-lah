import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { DiscountType } from '../../common/enums/discount-type.enum';
import { IsFutureDate } from '../../common/validators/future-date.validator';

export class CreatePromotionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  eligibleCategories?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  eligibleItems?: string[];

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  discountValue: number;

  @ApiProperty()
  @IsDateString()
  @IsFutureDate({ message: 'expirationDate must be in the future' })
  expirationDate: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  usageLimit: number;
}
