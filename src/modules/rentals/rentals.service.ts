import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from '../../entities/Rental';
import { CreateRentalDto } from '../../dto/create-rental.dto';
import { addDays, subDays, isAfter, isBefore } from 'date-fns';
import { AppointmentStatus } from 'src/entities/Rental';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private rentalRepo: Repository<Rental>,
  ) {}

  // =========================
  // CREATE RENTAL
  // =========================
  async create(dto: CreateRentalDto) {
    const { dressId, rentStart, rentEnd } = dto;

    const start = new Date(rentStart);
    const end = new Date(rentEnd);

    if (isAfter(start, end)) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    const existingRentals = await this.rentalRepo.find({
      where: { dress: { id: dressId } },
    });

    for (const rental of existingRentals) {
      const existingStart = new Date(rental.rentStart);
      const existingEnd = new Date(rental.rentEnd);

      const bufferStart = subDays(existingStart, 2);
      const bufferEnd = addDays(existingEnd, 2);

      // 1️⃣ Check rent overlap
      const rentOverlap = start <= existingEnd && end >= existingStart;

      if (rentOverlap) {
        throw new BadRequestException('Khoảng thời gian đã có người thuê');
      }

      // 2️⃣ Check buffer overlap
      const overlapWithBuffer = start <= bufferEnd && end >= bufferStart;

      const onlyBufferTouch =
        isAfter(start, existingEnd) && isBefore(end, existingStart);

      if (overlapWithBuffer && !onlyBufferTouch) {
        throw new BadRequestException('Thời gian nằm trong buffer xử lý váy');
      }
    }

    const rental = this.rentalRepo.create({
      customerName: dto.customerName,
      rentStart: dto.rentStart,
      rentEnd: dto.rentEnd,
      dress: { id: dressId },
    });

    return this.rentalRepo.save(rental);
  }

  // =========================
  // FIND ALL
  // =========================
  async findAll() {
    return this.rentalRepo.find({
      relations: ['dress'],
    });
  }

  // =========================
  // GET CALENDAR (FIXED)
  // =========================
  async getCalendar(dressId: number) {
    const rentals = await this.rentalRepo.find({
      where: {
        dress: { id: dressId },
        status: AppointmentStatus.CONFIRMED, // Thêm dòng này để chỉ lấy đơn đã hoàn tất
      },
    });

    const dateMap = new Map<string, { date: string; type: string }>();

    for (const rental of rentals) {
      const start = new Date(rental.rentStart);
      const end = new Date(rental.rentEnd);

      const bufferStart = subDays(start, 2);
      const bufferEnd = addDays(end, 2);

      const startStr = this.formatDate(start);
      const endStr = this.formatDate(end);

      for (let d = bufferStart; d <= bufferEnd; d = addDays(d, 1)) {
        const dateStr = this.formatDate(d);

        // So sánh bằng string thay vì Date object
        if (dateStr >= startStr && dateStr <= endStr) {
          dateMap.set(dateStr, {
            date: dateStr,
            type: 'rent',
          });
        } else {
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, {
              date: dateStr,
              type: 'buffer',
            });
          }
        }
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async getByUser(userId: number) {
    return this.rentalRepo.find({
      where: { user: { id: userId } },
      relations: ['dress'],
      select: {
        id: true,
        customerName: true,
        phone: true,
        rentStart: true,
        rentEnd: true,
        status: true, // THÊM TRẠNG THÁI VÀO ĐÂY
        dress: {
          id: true,
          name: true,
          mainImage: true, // Lấy thêm ảnh để hiển thị cho đẹp
          price: true,
        },
      },
      order: { rentStart: 'DESC' },
    });
  }
  async updateStatus(id: number, status: AppointmentStatus) {
    const rental = await this.rentalRepo.findOne({ where: { id } });

    if (!rental) {
      throw new NotFoundException(`Không tìm thấy đơn thuê #${id}`);
    }

    rental.status = status;
    return await this.rentalRepo.save(rental);
  }
}
