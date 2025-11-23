import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
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

export class CreateVoucherDto {
  @ApiPropertyOptional({ description: 'Provide to use a custom voucher code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    description: 'Value of the discount (percentage or fixed amount)',
  })
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

  @ApiPropertyOptional({
    description: 'Minimum order total required to use voucher',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;
}
