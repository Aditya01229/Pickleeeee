// src/organization/organization.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateTournamentDto, 
  AddCategoryDto, 
  UpdateTournamentDto, 
  UpdateCategoryDto 
} from '../user/dto/tournament.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async createTournament(orgId: number, userId: number, createTournamentDto: CreateTournamentDto) {
    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Verify user is a manager or super_manager of the organization
    const membership = await this.prisma.orgMembership.findUnique({
      where: {
        orgId_userId: {
          orgId: orgId,
          userId: userId
        }
      }
    });

    if (!membership || (membership.role !== 'manager' && membership.role !== 'super_manager')) {
      throw new ForbiddenException('Only managers can create tournaments');
    }

    // Verify game exists
    const game = await this.prisma.game.findUnique({
      where: { id: createTournamentDto.gameId }
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${createTournamentDto.gameId} not found. Please create games first or use SETUP_GUIDE.md to seed games.`);
    }

    // Check if tournament slug already exists in this organization
    const existingTournament = await this.prisma.tournament.findUnique({
      where: {
        orgId_slug: {
          orgId: orgId,
          slug: createTournamentDto.slug
        }
      }
    });

    if (existingTournament) {
      throw new BadRequestException(`Tournament with slug '${createTournamentDto.slug}' already exists in this organization`);
    }

    return this.prisma.tournament.create({
      data: {
        ...createTournamentDto,
        orgId: orgId,
        createdBy: userId
      },
      include: {
        organization: true,
        game: true,
        categories: true
      }
    });
  }

  async addTournamentCategory(orgId: number, tournamentId: number, userId: number, addCategoryDto: AddCategoryDto) {
    // Verify tournament exists and belongs to organization
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.orgId !== orgId) {
      throw new ForbiddenException('Tournament does not belong to this organization');
    }

    const isCreator = tournament.createdBy === userId;
    const userMembership = tournament.organization.memberships.find(m => m.userId === userId);
    const isManager = userMembership && (userMembership.role === 'manager' || userMembership.role === 'super_manager');

    if (!isCreator && !isManager) {
      throw new ForbiddenException('Not authorized to add categories');
    }

    // Validate teamSize for TEAM entryType
    if (addCategoryDto.entryType === 'TEAM' && !addCategoryDto.teamSize) {
      throw new BadRequestException('teamSize is required for TEAM entryType');
    }

    // Store teamSize in settings if provided
    const settings = addCategoryDto.settings || {};
    if (addCategoryDto.teamSize) {
      settings.teamSize = addCategoryDto.teamSize;
    }

    return this.prisma.tournamentCategory.create({
      data: {
        name: addCategoryDto.name,
        key: addCategoryDto.key,
        entryType: addCategoryDto.entryType,
        entryLimit: addCategoryDto.entryLimit,
        regDeadline: addCategoryDto.regDeadline,
        startDate: addCategoryDto.startDate,
        endDate: addCategoryDto.endDate,
        courtsCount: addCategoryDto.courtsCount,
        matchDurationMinutes: addCategoryDto.matchDurationMinutes,
        bufferMinutes: addCategoryDto.bufferMinutes,
        scoringMode: addCategoryDto.scoringMode,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        tournamentId: tournamentId
      },
      include: {
        tournament: true
      }
    });
  }

  async getOrganizationTournaments(orgId: number) {
    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.tournament.findMany({
      where: { orgId },
      include: {
        organization: true,
        game: true,
        categories: {
          include: {
            _count: {
              select: {
                registrations: true,
                teams: true
              }
            }
          }
        },
        _count: {
          select: {
            registrations: true,
            matches: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTournament(orgId: number, tournamentId: number, userId: number, updateTournamentDto: UpdateTournamentDto) {
    // Verify tournament exists and belongs to organization
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.orgId !== orgId) {
      throw new ForbiddenException('Tournament does not belong to this organization');
    }

    const isCreator = tournament.createdBy === userId;
    const userMembership = tournament.organization.memberships.find(m => m.userId === userId);
    const isManager = userMembership && (userMembership.role === 'manager' || userMembership.role === 'super_manager');

    if (!isCreator && !isManager) {
      throw new ForbiddenException('Not authorized to update this tournament');
    }

    // If slug is being updated, check for uniqueness
    if (updateTournamentDto.slug && updateTournamentDto.slug !== tournament.slug) {
      const existingTournament = await this.prisma.tournament.findUnique({
        where: {
          orgId_slug: {
            orgId: orgId,
            slug: updateTournamentDto.slug
          }
        }
      });

      if (existingTournament) {
        throw new BadRequestException(`Tournament with slug '${updateTournamentDto.slug}' already exists in this organization`);
      }
    }

    // If gameId is being updated, verify game exists
    if (updateTournamentDto.gameId) {
      const game = await this.prisma.game.findUnique({
        where: { id: updateTournamentDto.gameId }
      });

      if (!game) {
        throw new NotFoundException(`Game with ID ${updateTournamentDto.gameId} not found`);
      }
    }

    return this.prisma.tournament.update({
      where: { id: tournamentId },
      data: updateTournamentDto,
      include: {
        organization: true,
        game: true,
        categories: true
      }
    });
  }

  async updateCategory(orgId: number, tournamentId: number, categoryId: number, userId: number, updateCategoryDto: UpdateCategoryDto) {
    // Verify category exists and belongs to tournament
    const category = await this.prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: {
        tournament: {
          include: {
            organization: {
              include: {
                memberships: {
                  where: { userId }
                }
              }
            }
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.tournamentId !== tournamentId) {
      throw new ForbiddenException('Category does not belong to this tournament');
    }

    if (category.tournament.orgId !== orgId) {
      throw new ForbiddenException('Tournament does not belong to this organization');
    }

    const isCreator = category.tournament.createdBy === userId;
    const userMembership = category.tournament.organization.memberships.find(m => m.userId === userId);
    const isManager = userMembership && (userMembership.role === 'manager' || userMembership.role === 'super_manager');

    if (!isCreator && !isManager) {
      throw new ForbiddenException('Not authorized to update this category');
    }

    // Validate teamSize for TEAM entryType
    const entryType = updateCategoryDto.entryType || category.entryType;
    const currentSettings = (category.settings as any) || {};
    if (entryType === 'TEAM' && updateCategoryDto.teamSize === undefined && !currentSettings.teamSize) {
      throw new BadRequestException('teamSize is required for TEAM entryType');
    }

    // Handle teamSize in settings
    const newSettings = updateCategoryDto.settings || {};
    const finalSettings = { ...currentSettings, ...(newSettings as any) };
    
    if (updateCategoryDto.teamSize !== undefined) {
      finalSettings.teamSize = updateCategoryDto.teamSize;
    }

    // If key is being updated, check for uniqueness
    if (updateCategoryDto.key && updateCategoryDto.key !== category.key) {
      const existingCategory = await this.prisma.tournamentCategory.findUnique({
        where: {
          tournamentId_key: {
            tournamentId: tournamentId,
            key: updateCategoryDto.key
          }
        }
      });

      if (existingCategory) {
        throw new BadRequestException(`Category with key '${updateCategoryDto.key}' already exists in this tournament`);
      }
    }

    // Build update data
    const updateData: any = {};
    if (updateCategoryDto.name !== undefined) updateData.name = updateCategoryDto.name;
    if (updateCategoryDto.key !== undefined) updateData.key = updateCategoryDto.key;
    if (updateCategoryDto.entryType !== undefined) updateData.entryType = updateCategoryDto.entryType;
    if (updateCategoryDto.entryLimit !== undefined) updateData.entryLimit = updateCategoryDto.entryLimit;
    if (updateCategoryDto.regDeadline !== undefined) updateData.regDeadline = updateCategoryDto.regDeadline;
    if (updateCategoryDto.startDate !== undefined) updateData.startDate = updateCategoryDto.startDate;
    if (updateCategoryDto.endDate !== undefined) updateData.endDate = updateCategoryDto.endDate;
    if (updateCategoryDto.courtsCount !== undefined) updateData.courtsCount = updateCategoryDto.courtsCount;
    if (updateCategoryDto.matchDurationMinutes !== undefined) updateData.matchDurationMinutes = updateCategoryDto.matchDurationMinutes;
    if (updateCategoryDto.bufferMinutes !== undefined) updateData.bufferMinutes = updateCategoryDto.bufferMinutes;
    if (updateCategoryDto.scoringMode !== undefined) updateData.scoringMode = updateCategoryDto.scoringMode;
    updateData.settings = Object.keys(finalSettings).length > 0 ? finalSettings : undefined;

    return this.prisma.tournamentCategory.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        tournament: true
      }
    });
  }

  async deleteCategory(orgId: number, tournamentId: number, categoryId: number, userId: number) {
    // Verify category exists and belongs to tournament
    const category = await this.prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: {
        tournament: {
          include: {
            organization: {
              include: {
                memberships: {
                  where: { userId }
                }
              }
            }
          }
        },
        _count: {
          select: {
            registrations: true,
            teams: true
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.tournamentId !== tournamentId) {
      throw new ForbiddenException('Category does not belong to this tournament');
    }

    if (category.tournament.orgId !== orgId) {
      throw new ForbiddenException('Tournament does not belong to this organization');
    }

    const isCreator = category.tournament.createdBy === userId;
    const userMembership = category.tournament.organization.memberships.find(m => m.userId === userId);
    const isManager = userMembership && (userMembership.role === 'manager' || userMembership.role === 'super_manager');

    if (!isCreator && !isManager) {
      throw new ForbiddenException('Not authorized to delete this category');
    }

    // Check if category has registrations or teams
    if (category._count.registrations > 0 || category._count.teams > 0) {
      throw new BadRequestException('Cannot delete category with existing registrations or teams');
    }

    await this.prisma.tournamentCategory.delete({
      where: { id: categoryId }
    });

    return { message: 'Category deleted successfully' };
  }
}

