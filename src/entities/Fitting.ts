import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Dress } from './Dress';
import { User } from './User';
export enum AppointmentStatus {
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}
@Entity()
@Unique(['dress', 'date', 'timeSlot']) // 🔥 CHỐNG TRÙNG
export class FittingAppointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  customerName!: string;

  @Column()
  phone!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  timeSlot!: string;

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
}
