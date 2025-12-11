// src/organization/organization.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param, 
  Query,
  ParseIntPipe,
  UseGuards 
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import {
  CreateTournamentDto,
  AddCategoryDto,
  UpdateTournamentDto,
  UpdateCategoryDto
} from '../user/dto/tournament.dto';

@Controller('organizations')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  // ==========================================
  // TOURNAMENT MANAGEMENT (MANAGER)
  // ==========================================

  /**
   * Create a new tournament (manager/super_manager only)
   * POST /organizations/:orgId/tournaments
   */
  @Post(':orgId/tournaments')
  @UseGuards(JwtAuthGuard)
  createTournament(
    @Param('orgId', ParseIntPipe) orgId: number,
    @CurrentUser() user: any,
    @Body() createTournamentDto: CreateTournamentDto
  ) {
    return this.organizationService.createTournament(orgId, user.userId, createTournamentDto);
  }

  /**
   * Add category to tournament (manager/super_manager only)
   * POST /organizations/:orgId/tournaments/:tournamentId/categories
   */
  @Post(':orgId/tournaments/:tournamentId/categories')
  @UseGuards(JwtAuthGuard)
  addTournamentCategory(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @CurrentUser() user: any,
    @Body() addCategoryDto: AddCategoryDto
  ) {
    return this.organizationService.addTournamentCategory(orgId, tournamentId, user.userId, addCategoryDto);
  }

  /**
   * Get all tournaments for an organization
   * GET /organizations/:orgId/tournaments
   */
  @Get(':orgId/tournaments')
  @UseGuards(JwtAuthGuard)
  getOrganizationTournaments(@Param('orgId', ParseIntPipe) orgId: number) {
    return this.organizationService.getOrganizationTournaments(orgId);
  }

  /**
   * Update a tournament (manager/super_manager only)
   * PUT /organizations/:orgId/tournaments/:tournamentId
   */
  @Put(':orgId/tournaments/:tournamentId')
  @UseGuards(JwtAuthGuard)
  updateTournament(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @CurrentUser() user: any,
    @Body() updateTournamentDto: UpdateTournamentDto
  ) {
    return this.organizationService.updateTournament(orgId, tournamentId, user.userId, updateTournamentDto);
  }

  /**
   * Update a tournament category (manager/super_manager only)
   * PUT /organizations/:orgId/tournaments/:tournamentId/categories/:categoryId
   */
  @Put(':orgId/tournaments/:tournamentId/categories/:categoryId')
  @UseGuards(JwtAuthGuard)
  updateCategory(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser() user: any,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.organizationService.updateCategory(orgId, tournamentId, categoryId, user.userId, updateCategoryDto);
  }

  /**
   * Delete a tournament category (manager/super_manager only)
   * DELETE /organizations/:orgId/tournaments/:tournamentId/categories/:categoryId
   */
  @Delete(':orgId/tournaments/:tournamentId/categories/:categoryId')
  @UseGuards(JwtAuthGuard)
  deleteCategory(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser() user: any
  ) {
    return this.organizationService.deleteCategory(orgId, tournamentId, categoryId, user.userId);
  }
}

