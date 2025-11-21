import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Product category identifier' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Unit price for the product' })
  @IsNumber()
  @Min(0.01)
  unitPrice: number;

  @ApiProperty({ description: 'Quantity ordered' })
  @IsPositive()
  quantity: number;
}
