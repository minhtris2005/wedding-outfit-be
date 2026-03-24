import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DressesController } from './dresses.controller';
import { DressesService } from './dresses.service';
import { Dress } from 'src/entities/Dress';

@Module({
  imports: [TypeOrmModule.forFeature([Dress])],
  controllers: [DressesController],
  providers: [DressesService],
  exports: [DressesService],
})
export class DressesModule {}
