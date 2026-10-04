import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { District } from '../districts/district.entity';
import { Poi } from '../pois/poi.entity';
import { PlaceRating } from '../ratings/place-rating.entity';
import { Report } from './report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Poi, District, PlaceRating])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
