import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplyOrderDto } from './dto/apply-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('apply')
  applyDiscount(@Body() applyOrderDto: ApplyOrderDto) {
    return this.ordersService.applyOrderDiscount(applyOrderDto);
  }
}
