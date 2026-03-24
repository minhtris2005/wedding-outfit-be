import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from '../../dto/create-rental.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AppointmentStatus } from 'src/entities/Fitting';
import { RolesGuard } from '../auth/roles.guard';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  // 🔥 Tạo đơn thuê
  @Post()
  create(@Body() dto: CreateRentalDto) {
    return this.rentalsService.create(dto);
  }

  // 🔥 Lấy tất cả đơn thuê (admin)
  @Get()
  findAll() {
    return this.rentalsService.findAll();
  }

  // 🔥 Lấy dữ liệu calendar theo dress
  @Get('calendar/:dressId')
  getCalendar(@Param('dressId') dressId: string) {
    return this.rentalsService.getCalendar(Number(dressId));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('my')
  getMyRentals(@Req() req) {
    return this.rentalsService.getByUser(req.user.id);
  }
  @Get('my-role')
  @UseGuards(JwtAuthGuard)
  getMyRole(@Req() req) {
    return {
      user: req.user,
      role: req.user.role,
      type: typeof req.user.role,
    };
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.rentalsService.updateStatus(id, status);
  }
}
