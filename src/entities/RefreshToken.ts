// auth/refresh-token.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ length: 500 })
  token!: string;

  @Column({ default: false })
  isRevoked!: boolean;

  @Column()
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
