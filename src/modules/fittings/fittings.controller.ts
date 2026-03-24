import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FittingsService } from './fittings.service';
import { CreateFittingDto } from '../../dto/create-fitting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AppointmentStatus } from 'src/entities/Fitting';
import { RolesGuard } from '../auth/roles.guard';

@Controller('fittings')
export class FittingsController {
  constructor(private readonly fittingsService: FittingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Thêm dòng này để bảo mật và lấy User
  create(@Body() dto: CreateFittingDto, @Req() req) {
    // Truyền req.user.id vào Service
    return this.fittingsService.create(dto, req.user.id);
  }

  @Get()
  findAll() {
    return this.fittingsService.findAll();
  }

  @Get('by-date')
  findByDate(@Query('dressId') dressId: string, @Query('date') date: string) {
    return this.fittingsService.findByDate(Number(dressId), date);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('my')
  getMyFittings(@Req() req) {
    return this.fittingsService.getByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.fittingsService.updateStatus(id, status);
  }
}
