import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FittingAppointment } from '../../entities/Fitting';
import { CreateFittingDto } from '../../dto/create-fitting.dto';
import { AppointmentStatus } from 'src/entities/Fitting';

@Injectable()
export class FittingsService {
  constructor(
    @InjectRepository(FittingAppointment)
    private fittingRepo: Repository<FittingAppointment>,
  ) {}

  async create(dto: CreateFittingDto, userId: number) {
    try {
      const fitting = this.fittingRepo.create({
        customerName: dto.customerName,
        phone: dto.phone,
        date: dto.date,
        timeSlot: dto.timeSlot,
        dress: { id: dto.dressId },
        user: { id: userId },
      });

      return await this.fittingRepo.save(fitting);
    } catch (error: any) {
      // 🔥 bắt lỗi unique constraint
      if (error.code === '23505') {
        throw new BadRequestException('Khung giờ này đã có người đặt rồi');
      }
      throw error;
    }
  }

  async findAll() {
    return this.fittingRepo.find({
      relations: ['dress'],
    });
  }

  async findByDate(dressId: number, date: string) {
    return this.fittingRepo.find({
      where: {
        dress: { id: dressId },
        date: date, // 🔥 CHỈ LỌC ĐÚNG NGÀY
        status: AppointmentStatus.PENDING,
      },
    });
  }
  async getByUser(userId: number) {
    return this.fittingRepo.find({
      where: {
        user: { id: userId },
      },
      relations: ['dress'],
      select: {
        id: true,
        customerName: true,
        phone: true,
        date: true,
        timeSlot: true,
        status: true, // Nhớ thêm status vào Entity nếu chưa có
        dress: {
          id: true,
          name: true,
          mainImage: true,
        },
      },
      order: { date: 'DESC' },
    });
  }
  async updateStatus(id: number, status: AppointmentStatus) {
    const fitting = await this.fittingRepo.findOne({ where: { id } });

    if (!fitting) {
      throw new NotFoundException(`Không tìm thấy lịch thử #${id}`);
    }

    fitting.status = status;
    return await this.fittingRepo.save(fitting);
  }
}
