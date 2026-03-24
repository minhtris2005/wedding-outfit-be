import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './bookings.service';
import { BookingController } from './bookings.controller';
import { Rental } from '../../entities/Rental';
import { FittingAppointment } from '../../entities/Fitting';
import { Dress } from '../../entities/Dress';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, FittingAppointment, Dress])],
  providers: [BookingService],
  controllers: [BookingController],
})
export class BookingModule {}
