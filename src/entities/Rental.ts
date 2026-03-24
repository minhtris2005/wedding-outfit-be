import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Dress } from './Dress';
import { User } from './User';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}
@Entity()
export class Rental {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  phone!: string;

  @Column()
  customerName!: string;

  @Column({ type: 'date' })
  rentStart!: string;

  @Column({ type: 'date' })
  rentEnd!: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;
  @ManyToOne(() => Dress, { onDelete: 'CASCADE' })
  dress!: Dress;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
  @CreateDateColumn()
  createdAt!: Date;
}
