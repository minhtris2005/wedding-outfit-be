import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FittingAppointment } from '../../entities/Fitting';
import { Dress } from '../../entities/Dress';
import { FittingsService } from './fittings.service';
import { FittingsController } from './fittings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FittingAppointment, Dress])],
  controllers: [FittingsController],
  providers: [FittingsService],
})
export class FittingsModule {}
