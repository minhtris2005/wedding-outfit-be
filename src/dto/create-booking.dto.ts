import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  dressId!: number;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  rentStart!: string;

  @IsString()
  rentEnd!: string;

  @IsString()
  fittingDate!: string;

  @IsString()
  timeSlot!: string;
}
