import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Rental } from '../../entities/Rental';
import { FittingAppointment } from '../../entities/Fitting';
import { Dress } from '../../entities/Dress';
import { User } from '../../entities/User'; // 🔥 THÊM IMPORT
import { CreateBookingDto } from '../../dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto, userId: number) {
    console.log('USER ID FROM CONTROLLER:', userId);
    return this.dataSource.transaction(async (manager) => {
      // 🔥 1️⃣ LẤY USER TRƯỚC
      const user = await manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 2️⃣ Check dress tồn tại
      const dress = await manager.findOne(Dress, {
        where: { id: dto.dressId },
      });

      if (!dress) {
        throw new NotFoundException('Dress not found');
      }

      // 3️⃣ Check RENT overlap
      const overlap = await manager
        .createQueryBuilder(Rental, 'r')
        .where('r.dressId = :dressId', { dressId: dto.dressId })
        .andWhere(
          `
          (
            (:start BETWEEN r.rentStart AND r.rentEnd)
            OR
            (:end BETWEEN r.rentStart AND r.rentEnd)
            OR
            (r.rentStart BETWEEN :start AND :end)
          )
        `,
          {
            start: dto.rentStart,
            end: dto.rentEnd,
          },
        )
        .getOne();

      if (overlap) {
        throw new BadRequestException('Khoảng thời gian thuê đã bị trùng');
      }

      // 4️⃣ Insert Rental
      const rental = manager.create(Rental, {
        customerName: dto.customerName,
        phone: dto.phone,
        rentStart: dto.rentStart,
        rentEnd: dto.rentEnd,
        dress,
        user, // ✅ BÂY GIỜ OK
      });

      await manager.save(rental);

      // 5️⃣ Insert Fitting
      const fitting = manager.create(FittingAppointment, {
        customerName: dto.customerName,
        phone: dto.phone,
        date: dto.fittingDate,
        timeSlot: dto.timeSlot,
        dress,
        user, // ✅ OK
      });

      try {
        await manager.save(fitting);
      } catch (error) {
        throw new BadRequestException('Khung giờ thử váy đã bị đặt');
      }

      return {
        message: 'Booking created successfully',
        rental,
        fitting,
      };
    });
  }
}
