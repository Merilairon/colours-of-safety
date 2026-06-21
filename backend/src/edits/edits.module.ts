import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { District } from '../districts/district.entity';
import { Poi } from '../pois/poi.entity';
import { EditsController } from './edits.controller';
import { EditProposal } from './edit-proposal.entity';
import { EditsService } from './edits.service';

@Module({
  imports: [TypeOrmModule.forFeature([EditProposal, Poi, District])],
  controllers: [EditsController],
  providers: [EditsService],
})
export class EditsModule {}
