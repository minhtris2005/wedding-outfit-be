import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { FittingAppointment } from './Fitting';

@Entity('dresses')
export class Dress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column('decimal')
  price!: number;

  // Ảnh chính (bắt buộc)
  @Column()
  mainImage!: string;

  // 1-3 ảnh phụ (lưu dạng json array)
  @Column('simple-json', { nullable: true })
  subImages!: string[];

  @Column({ default: false })
  isFeatured!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => FittingAppointment, (fitting) => fitting.dress)
  fittings!: FittingAppointment[];
}
