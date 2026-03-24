import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { BookingService } from './bookings.service';
import { CreateBookingDto } from '../../dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBookingDto, @Req() req) {
    console.log('REQ.USER:', req.user);
    return this.bookingService.create(dto, req.user.id);
  }
}
