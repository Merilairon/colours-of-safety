import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { District } from './district.entity';
import { DistrictsController } from './districts.controller';
import { DistrictsService } from './districts.service';

@Module({
  imports: [TypeOrmModule.forFeature([District])],
  controllers: [DistrictsController],
  providers: [DistrictsService],
})
export class DistrictsModule {}
