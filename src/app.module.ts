import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './entities/User';
import { DressesModule } from './modules/dresses/dresses.module';
import { Dress } from './entities/Dress';
import { FittingAppointment } from './entities/Fitting';
import { FittingsModule } from './modules/fittings/fittings.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { Rental } from './entities/Rental';
import { BookingModule } from './modules/bookings/bookings.module';
import { RefreshToken } from './entities/RefreshToken';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres', // Loại database: mysql, postgres, sqlite, etc,..
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '24092005T',
      database: 'postgres',
      entities: [User, Dress, FittingAppointment, Rental, RefreshToken], //danh sách các entity sẽ ánh xạ
      synchronize: true, //tự động tạo bảng từ entity(chỉ dùng trong dev)
    }),
    UsersModule,
    AuthModule,
    DressesModule,
    FittingsModule,
    RentalsModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
