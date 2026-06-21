import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { ReviewDto } from '../common/review.dto';
import { UserRole } from '../users/user.entity';
import { CreateEditProposalDto } from './dto/create-edit-proposal.dto';
import { EditProposal } from './edit-proposal.entity';
import { EditsService } from './edits.service';

@Controller('edits')
export class EditsController {
  constructor(private readonly edits: EditsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(
    @Body() dto: CreateEditProposalDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EditProposal> {
    return this.edits.create(dto, user.id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findPending(): Promise<EditProposal[]> {
    return this.edits.findPending();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser): Promise<EditProposal[]> {
    return this.edits.findMine(user.id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EditProposal> {
    return this.edits.review(id, dto, user.id);
  }
}
