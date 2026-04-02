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
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Dress, FittingAppointment, Rental, RefreshToken],
        synchronize: true, // chỉ dùng trong dev, production nên set false
        ssl: {
          rejectUnauthorized: false, // Bắt buộc để kết nối DB Cloud.
        },
      }),
      inject: [ConfigService],
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
