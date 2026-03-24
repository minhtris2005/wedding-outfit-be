import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DressesService } from './dresses.service';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('dresses')
export class DressesController {
  constructor(private readonly dressesService: DressesService) {}

  @Get()
  findAll() {
    return this.dressesService.findAll();
  }

  @Get('featured')
  findFeatured() {
    return this.dressesService.findFeatured();
  }

  @Get('latest')
  findLatest() {
    return this.dressesService.findLatest();
  }
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.dressesService.findOne(id);
  }

  // Admin only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() body) {
    return this.dressesService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: number, @Body() body) {
    return this.dressesService.update(+id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.dressesService.remove(+id);
  }
}
