import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dress } from 'src/entities/Dress';

@Injectable()
export class DressesService {
  constructor(
    @InjectRepository(Dress)
    private dressRepository: Repository<Dress>,
  ) {}
  create(data: Partial<Dress>) {
    const dress = this.dressRepository.create(data);
    return this.dressRepository.save(dress);
  }
  async update(id: number, data: Partial<Dress>) {
    // 1. Tìm bản ghi cũ
    const dress = await this.findOne(id);
    if (!dress) throw new NotFoundException(`Dress with ID ${id} not found`);

    // 2. Chỉ lấy các trường hợp lệ từ data (Loại bỏ ID để tránh ghi đè ID)
    // Việc bóc tách này giúp tránh việc Admin vô tình đổi ID của váy
    const { name, description, price, mainImage, subImages, isFeatured } = data;

    // 3. Cập nhật từng trường (có kiểm tra dữ liệu)
    if (name !== undefined) dress.name = name;
    if (description !== undefined) dress.description = description;
    if (price !== undefined) dress.price = Number(price); // Đảm bảo là Number
    if (mainImage !== undefined) dress.mainImage = mainImage;
    if (subImages !== undefined) dress.subImages = subImages;
    if (isFeatured !== undefined) dress.isFeatured = isFeatured;

    // 4. Lưu lại
    return this.dressRepository.save(dress);
  }

  async remove(id: number) {
    const dress = await this.findOne(id);
    if (!dress) throw new NotFoundException('Dress not found');

    return this.dressRepository.remove(dress);
  }
  findAll() {
    return this.dressRepository.find();
  }
  async findOne(id: number) {
    return this.dressRepository.findOne({
      where: { id: Number(id) },
    });
  }

  findFeatured() {
    return this.dressRepository.find({
      where: { isFeatured: true },
      take: 6,
    });
  }

  findLatest() {
    return this.dressRepository.find({
      order: { createdAt: 'DESC' },
      take: 6,
    });
  }
}
