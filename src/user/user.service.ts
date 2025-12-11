// src/user/user.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { 
  CreateUserDto, 
  LoginDto, 
  UpdateProfileDto 
} from './dto/create-user.dto';
import {
  JoinOrganizationDto,
  CreateOrganizationDto
} from './dto/organization.dto';
import {
  RegisterTournamentDto,
  PayRegistrationDto,
  EntryType
} from './dto/tournament.dto';
import {
  CreateTeamDto,
  InviteTeamMemberDto,
  RespondToTeamInviteDto,
  UpdateTeamDto,
  RemoveTeamMemberDto,
  LeaveTeamDto
} from './dto/team.dto';
import {
  CreatePlayerProfileDto,
  UpdatePlayerProfileDto
} from './dto/player-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  // ==========================================
  // 1. AUTHENTICATION & USER MANAGEMENT
  // ==========================================

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password before saving
    const hashedPassword = await this.authService.hashPassword(createUserDto.password);

    // Explicitly construct user data without password to avoid TypeScript issues
    const userData = {
      name: createUserDto.name,
      email: createUserDto.email,
      phone: createUserDto.phone,
      avatarUrl: createUserDto.avatarUrl,
    };

    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        orgMemberships: {
          include: {
            organization: true
          }
        }
      }
    });
  }

  async login(loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orgMemberships: {
          include: {
            organization: true
          }
        },
        playerProfiles: {
          include: {
            game: true
          }
        },
        captainedTeams: {
          include: {
            tournament: true,
            category: true,
            members: {
              include: {
                user: true
              }
            }
          }
        },
        teamMemberships: {
          include: {
            team: {
              include: {
                tournament: true,
                category: true,
                captain: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      include: {
        playerProfiles: {
          include: {
            game: true
          }
        }
      }
    });
  }

  // ==========================================
  // 2. ORGANIZATION MANAGEMENT
  // ==========================================

  async createOrganization(userId: number, createOrgDto: CreateOrganizationDto) {
    // Create organization and automatically make the creator a super_manager
    
    // Check if organization with this slug already exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: createOrgDto.slug }
    });

    if (existingOrg) {
      throw new BadRequestException(`Organization with slug '${createOrgDto.slug}' already exists`);
    }

    // Validate defaultGameId if provided
    if (createOrgDto.defaultGameId) {
      const game = await this.prisma.game.findUnique({
        where: { id: createOrgDto.defaultGameId }
      });
      
      if (!game) {
        throw new BadRequestException('Invalid game ID');
      }
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: createOrgDto.name,
        slug: createOrgDto.slug,
        defaultGameId: createOrgDto.defaultGameId || null,
        branding: createOrgDto.branding || null,
        memberships: {
          create: {
            userId: userId,
            role: 'super_manager'
          }
        }
      },
      include: {
        memberships: {
          include: {
            user: true
          }
        },
        defaultGame: true
      }
    });

    return organization;
  }

  async joinOrganization(userId: number, joinOrgDto: JoinOrganizationDto) {
    // Check if organization exists
    const org = await this.prisma.organization.findUnique({
      where: { id: joinOrgDto.organizationId }
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check if already a member
    const existingMembership = await this.prisma.orgMembership.findUnique({
      where: {
        orgId_userId: {
          orgId: joinOrgDto.organizationId,
          userId: userId
        }
      }
    });

    if (existingMembership) {
      throw new BadRequestException('Already a member of this organization');
    }

    // Create membership
    return this.prisma.orgMembership.create({
      data: {
        userId: userId,
        orgId: joinOrgDto.organizationId,
        role: joinOrgDto.role || 'follower'
      },
      include: {
        organization: true,
        user: true
      }
    });
  }

  async getUserOrganizations(userId: number) {
    return this.prisma.orgMembership.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            defaultGame: true,
            tournaments: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });
  }

  // ==========================================
  // 3. TOURNAMENT REGISTRATION (PLAYER)
  // ==========================================

  async registerForTournament(userId: number, registerDto: RegisterTournamentDto) {
    // Get tournament and category details
    const category = await this.prisma.tournamentCategory.findUnique({
      where: { id: registerDto.categoryId },
      include: {
        tournament: true
      }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if already registered
    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        tournamentId: registerDto.tournamentId,
        categoryId: registerDto.categoryId,
        userId: userId,
        status: 'registered'
      }
    });

    if (existingRegistration) {
      throw new BadRequestException('Already registered for this category');
    }

    // INDIVIDUAL registration
    if (category.entryType === EntryType.INDIVIDUAL) {
      const registration = await this.prisma.registration.create({
        data: {
          tournamentId: registerDto.tournamentId,
          categoryId: registerDto.categoryId,
          userId: userId,
          status: 'registered'
        },
        include: {
          tournament: true,
          category: true,
          user: true
        }
      });

      // Create notification
      await this.createNotification(
        userId,
        'registrationConfirmed',
        {
          message: `You have successfully registered for ${category.name} in ${category.tournament.name}`,
          tournamentId: registerDto.tournamentId,
          categoryId: registerDto.categoryId
        }
      );

      return registration;
    }

    // TEAM registration
    if (category.entryType === EntryType.TEAM) {
      if (!registerDto.teamId) {
        throw new BadRequestException('Team ID required for team categories');
      }

      // Verify team exists and user is a member
      const team = await this.prisma.team.findUnique({
        where: { id: registerDto.teamId },
        include: {
          members: {
            where: {
              status: 'accepted'
            },
            include: {
              user: true
            }
          },
          captain: true
        }
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      const isMember = team.captainUserId === userId || 
                       team.members.some(m => m.userId === userId);

      if (!isMember) {
        throw new ForbiddenException('Not a member of this team');
      }

      const registration = await this.prisma.registration.create({
        data: {
          tournamentId: registerDto.tournamentId,
          categoryId: registerDto.categoryId,
          userId: userId,
          teamId: registerDto.teamId,
          status: 'registered'
        },
        include: {
          tournament: true,
          category: true,
          user: true,
          team: {
            include: {
              captain: true,
              members: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      // Notify all team members
      const allMembers = [team.captain, ...team.members.filter(m => m.status === 'accepted').map(m => m.user)];
      for (const member of allMembers) {
        await this.createNotification(
          member.id,
          'registrationConfirmed',
          {
            message: `Team ${team.name} has been registered for ${category.name}`,
            tournamentId: registerDto.tournamentId,
            categoryId: registerDto.categoryId,
            teamId: team.id
          }
        );
      }

      return registration;
    }
  }

  async payRegistration(userId: number, payDto: PayRegistrationDto) {
    // Find the registration
    const registration = await this.prisma.registration.findUnique({
      where: { id: payDto.registrationId },
      include: {
        tournament: true,
        category: true,
        team: {
          include: {
            captain: true,
            members: {
              where: {
                status: 'accepted'
              },
              include: {
                user: true
              }
            }
          }
        },
        user: true
      }
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Check if already paid
    if (registration.paid) {
      throw new BadRequestException('Registration fees have already been paid');
    }

    // Check if registration is cancelled
    if (registration.status !== 'registered') {
      throw new BadRequestException('Cannot pay for a cancelled registration');
    }

    // For team registrations, verify user is the captain
    if (registration.teamId) {
      if (!registration.team) {
        throw new NotFoundException('Team not found');
      }

      if (registration.team.captainUserId !== userId) {
        throw new ForbiddenException('Only team captain can pay registration fees');
      }
    } else {
      // For individual registrations, verify user owns the registration
      if (registration.userId !== userId) {
        throw new ForbiddenException('You can only pay for your own registration');
      }
    }

    // Update registration with payment
    const updatedRegistration = await this.prisma.registration.update({
      where: { id: payDto.registrationId },
      data: {
        paid: true,
        paymentInfo: payDto.paymentInfo || {}
      },
      include: {
        tournament: true,
        category: true,
        team: {
          include: {
            captain: true,
            members: {
              include: {
                user: true
              }
            }
          }
        },
        user: true
      }
    });

    // Notify all team members if it's a team registration
    if (registration.teamId && registration.team) {
      const allMembers = [
        registration.team.captain,
        ...registration.team.members.map(m => m.user)
      ];

      for (const member of allMembers) {
        await this.createNotification(
          member.id,
          'paymentConfirmed',
          {
            message: `Registration fees have been paid for ${registration.category?.name || 'tournament'}`,
            tournamentId: registration.tournamentId,
            categoryId: registration.categoryId,
            teamId: registration.teamId
          }
        );
      }
    } else {
      // Notify individual registrant
      await this.createNotification(
        userId,
        'paymentConfirmed',
        {
          message: `Registration fees have been paid for ${registration.category?.name || 'tournament'}`,
          tournamentId: registration.tournamentId,
          categoryId: registration.categoryId
        }
      );
    }

    return updatedRegistration;
  }

  async getMyRegistrations(userId: number) {
    return this.prisma.registration.findMany({
      where: { 
        userId,
        status: 'registered'
      },
      include: {
        tournament: {
          include: {
            organization: true,
            game: true
          }
        },
        category: true,
        team: {
          include: {
            captain: true,
            members: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ==========================================
  // 5. TEAM MANAGEMENT
  // ==========================================

  async createTeam(userId: number, createTeamDto: CreateTeamDto) {
    // Verify category is team-based
    const category = await this.prisma.tournamentCategory.findUnique({
      where: { id: createTeamDto.categoryId }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.entryType !== EntryType.TEAM) {
      throw new BadRequestException('This category does not require teams');
    }

    // Check if user is already in another team for this category
    const userTeamsInCategory = await this.prisma.teamMember.findMany({
      where: {
        userId: userId,
        team: {
          categoryId: createTeamDto.categoryId
        }
      },
      include: {
        team: {
          include: {
            category: true
          }
        }
      }
    });

    // Also check if user is captain of another team in same category
    const userCaptainedTeams = await this.prisma.team.findMany({
      where: {
        captainUserId: userId,
        categoryId: createTeamDto.categoryId
      }
    });

    if (userTeamsInCategory.length > 0 || userCaptainedTeams.length > 0) {
      const existingTeamName = userCaptainedTeams.length > 0 
        ? userCaptainedTeams[0].name 
        : userTeamsInCategory[0].team.name;
      throw new BadRequestException(
        `You are already in team "${existingTeamName}" for this category. A player can only be in one team per category.`
      );
    }

    const team = await this.prisma.team.create({
      data: {
        ...createTeamDto,
        captainUserId: userId
      },
      include: {
        tournament: true,
        category: true,
        captain: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });

    return team;
  }

  async inviteTeamMember(userId: number, inviteDto: InviteTeamMemberDto) {
    // Verify user is team captain
    const team = await this.prisma.team.findUnique({
      where: { id: inviteDto.teamId },
      include: {
        category: true,
        members: true
      }
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.captainUserId !== userId) {
      throw new ForbiddenException('Only team captain can invite members');
    }

    // Check if user already a member
    const existingMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: inviteDto.teamId,
          userId: inviteDto.userId
        }
      }
    });

    if (existingMember) {
      throw new BadRequestException('User already invited or member');
    }

    // Check if user is already in another team for the same category
    if (team.categoryId) {
      const userTeamsInCategory = await this.prisma.teamMember.findMany({
        where: {
          userId: inviteDto.userId,
          team: {
            categoryId: team.categoryId
          }
        },
        include: {
          team: {
            include: {
              category: true
            }
          }
        }
      });

      // Also check if user is captain of another team in same category
      const userCaptainedTeams = await this.prisma.team.findMany({
        where: {
          captainUserId: inviteDto.userId,
          categoryId: team.categoryId
        }
      });

      if (userTeamsInCategory.length > 0 || userCaptainedTeams.length > 0) {
        const existingTeamName = userCaptainedTeams.length > 0 
          ? userCaptainedTeams[0].name 
          : userTeamsInCategory[0].team.name;
        throw new BadRequestException(
          `User is already in team "${existingTeamName}" for this category. A player can only be in one team per category.`
        );
      }
    }

    // Check teamSize limit from category settings
    if (team.category) {
      const categorySettings = (team.category.settings as any) || {};
      const teamSize = categorySettings.teamSize;

      if (teamSize) {
        // Count current members (including captain + accepted + invited members)
        // Captain is not in members table, so we count members + 1 for captain
        const currentMemberCount = team.members.length + 1; // +1 for captain

        if (currentMemberCount >= teamSize) {
          throw new BadRequestException(`Team size limit reached. Maximum ${teamSize} members allowed (including captain).`);
        }
      }
    }

    const teamMember = await this.prisma.teamMember.create({
      data: {
        teamId: inviteDto.teamId,
        userId: inviteDto.userId,
        status: 'invited'
      },
      include: {
        team: {
          include: {
            tournament: true,
            captain: true,
            category: true
          }
        },
        user: true
      }
    });

    // Create notification for invited user
    await this.createNotification(
      inviteDto.userId,
      'teamInvite',
      {
        message: `You have been invited to join team ${team.name}`,
        teamId: team.id,
        captainId: userId
      }
    );

    return teamMember;
  }

  async respondToTeamInvite(userId: number, respondDto: RespondToTeamInviteDto) {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: respondDto.teamId,
          userId: userId
        }
      },
      include: {
        team: {
          include: {
            captain: true,
            tournament: true
          }
        },
        user: true
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team invitation not found');
    }

    if (teamMember.status !== 'invited') {
      throw new BadRequestException('Invitation already processed');
    }

    if (respondDto.action === 'accept') {
      const updated = await this.prisma.teamMember.update({
        where: {
          teamId_userId: {
            teamId: respondDto.teamId,
            userId: userId
          }
        },
        data: {
          status: 'accepted',
          joinedAt: new Date()
        },
        include: {
          team: {
            include: {
              captain: true,
              tournament: true,
              members: {
                include: {
                  user: true
                }
              }
            }
          },
          user: true
        }
      });

      // Notify captain
      await this.createNotification(
        teamMember.team.captainUserId,
        'teamUpdate',
        {
          message: `${teamMember.user.name} accepted the invitation to ${teamMember.team.name}`,
          teamId: teamMember.teamId,
          userId: userId
        }
      );

      return updated;
    } else {
      // Reject - delete the invitation
      await this.prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: respondDto.teamId,
            userId: userId
          }
        }
      });

      // Notify captain
      await this.createNotification(
        teamMember.team.captainUserId,
        'teamUpdate',
        {
          message: `${teamMember.user.name} declined the invitation to ${teamMember.team.name}`,
          teamId: teamMember.teamId,
          userId: userId
        }
      );

      return { message: 'Invitation declined' };
    }
  }

  async removeTeamMember(userId: number, removeDto: RemoveTeamMemberDto) {
    // Verify user is team captain
    const team = await this.prisma.team.findUnique({
      where: { id: removeDto.teamId },
      include: {
        captain: true,
        category: true,
        registrations: {
          where: {
            status: 'registered'
          }
        }
      }
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.captainUserId !== userId) {
      throw new ForbiddenException('Only team captain can remove members');
    }

    // Cannot remove the captain
    if (removeDto.userId === team.captainUserId) {
      throw new BadRequestException('Cannot remove the team captain');
    }

    // Check if team has paid registration - prevent removal if paid
    const paidRegistration = team.registrations.find(reg => reg.paid === true);
    if (paidRegistration) {
      throw new ForbiddenException('Cannot remove team member after registration fees have been paid. Please contact the tournament organizer.');
    }

    // Find the team member to remove
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: removeDto.teamId,
          userId: removeDto.userId
        }
      },
      include: {
        user: true
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Delete the team member
    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: removeDto.teamId,
          userId: removeDto.userId
        }
      }
    });

    // Notify the removed user
    await this.createNotification(
      removeDto.userId,
      'teamUpdate',
      {
        message: `You have been removed from team ${team.name}`,
        teamId: team.id,
        captainId: userId
      }
    );

    return { 
      message: `Team member ${teamMember.user.name} has been removed from the team`,
      removedUserId: removeDto.userId
    };
  }

  async leaveTeam(userId: number, leaveDto: LeaveTeamDto) {
    // Find the team member record
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: leaveDto.teamId,
          userId: userId
        }
      },
      include: {
        team: {
          include: {
            captain: true,
            category: true,
            registrations: {
              where: {
                status: 'registered'
              }
            }
          }
        },
        user: true
      }
    });

    if (!teamMember) {
      throw new NotFoundException('You are not a member of this team');
    }

    // Check if user is the captain (captains can't leave, they need to delete team or transfer captaincy)
    if (teamMember.team.captainUserId === userId) {
      throw new BadRequestException('Team captain cannot leave the team. Transfer captaincy or delete the team instead.');
    }

    // Check if member has already left (status is not 'accepted')
    if (teamMember.status !== 'accepted') {
      throw new BadRequestException('You are not an active member of this team');
    }

    // Check if team registration is paid - prevent leaving if paid
    const teamRegistration = teamMember.team.registrations.find(
      reg => reg.status === 'registered'
    );
    
    if (teamRegistration && teamRegistration.paid) {
      throw new ForbiddenException('Cannot leave team after registration fees have been paid. Please contact the tournament organizer.');
    }
    
    // Check if team is registered - warn but allow leaving if not paid
    const isTeamRegistered = teamMember.team.registrations.length > 0;
    
    // Delete the team member record
    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: leaveDto.teamId,
          userId: userId
        }
      }
    });

    // Notify the captain
    await this.createNotification(
      teamMember.team.captainUserId,
      'teamUpdate',
      {
        message: `${teamMember.user.name} has left team ${teamMember.team.name}`,
        teamId: teamMember.team.id,
        userId: userId
      }
    );

    return { 
      message: `You have successfully left team ${teamMember.team.name}`,
      teamId: leaveDto.teamId,
      warning: isTeamRegistered 
        ? 'Note: This team is registered for a tournament. The captain may need to update the team roster.' 
        : undefined
    };
  }

  async getMyTeams(userId: number) {
    const captainedTeams = await this.prisma.team.findMany({
      where: { captainUserId: userId },
      include: {
        tournament: true,
        category: true,
        members: {
          include: {
            user: true
          }
        },
        registrations: true
      }
    });

    const memberTeams = await this.prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            tournament: true,
            category: true,
            captain: true,
            members: {
              include: {
                user: true
              }
            },
            registrations: true
          }
        }
      }
    });

    return {
      captainedTeams,
      memberTeams: memberTeams.map(m => m.team)
    };
  }

  async getTeamInvites(userId: number) {
    return this.prisma.teamMember.findMany({
      where: {
        userId,
        status: 'invited'
      },
      include: {
        team: {
          include: {
            tournament: true,
            category: true,
            captain: true
          }
        }
      }
    });
  }

  // ==========================================
  // 6. MATCH HISTORY & STATS
  // ==========================================

  async getMyMatches(userId: number, limit: number = 50) {
    // Get all teams where user is captain or member
    const userTeams = await this.prisma.team.findMany({
      where: {
        OR: [
          { captainUserId: userId },
          {
            members: {
              some: {
                userId: userId,
                status: 'accepted'
              }
            }
          }
        ]
      },
      select: { id: true }
    });

    const teamIds = userTeams.map(t => t.id);

    // Get matches for these teams
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { teamAId: { in: teamIds } },
          { teamBId: { in: teamIds } }
        ]
      },
      include: {
        tournament: true,
        category: true,
        teamA: {
          include: {
            captain: true,
            members: {
              include: {
                user: true
              }
            }
          }
        },
        teamB: {
          include: {
            captain: true,
            members: {
              include: {
                user: true
              }
            }
          }
        },
        game: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return matches.map(match => {
      const isTeamA = match.teamAId ? teamIds.includes(match.teamAId) : false;
      const myTeam = isTeamA ? match.teamA : match.teamB;
      const opponentTeam = isTeamA ? match.teamB : match.teamA;
      const myScore = isTeamA ? match.scoreA : match.scoreB;
      const opponentScore = isTeamA ? match.scoreB : match.scoreA;

      let result: 'won' | 'lost' | null = null;
      if (match.status === 'finished' && myScore !== null && opponentScore !== null) {
        result = myScore > opponentScore ? 'won' : 'lost';
      }

      return {
        ...match,
        myTeam,
        opponentTeam,
        myScore,
        opponentScore,
        result
      };
    });
  }

  async getMyStats(userId: number, tournamentId?: number) {
    // Get player profile
    const playerProfiles = await this.prisma.playerProfile.findMany({
      where: { userId },
      include: {
        game: true,
        playerStats: {
          where: tournamentId ? { tournamentId } : {},
          include: {
            tournament: true,
            category: true
          }
        }
      }
    });

    // Calculate overall stats from matches
    const matches = await this.getMyMatches(userId, 1000);
    
    const stats = {
      totalMatches: matches.length,
      wins: matches.filter(m => m.result === 'won').length,
      losses: matches.filter(m => m.result === 'lost').length,
      winRate: 0,
      playerProfiles
    };

    if (stats.totalMatches > 0) {
      stats.winRate = (stats.wins / stats.totalMatches) * 100;
    }

    return stats;
  }

  async getTournamentHistory(userId: number) {
    const registrations = await this.prisma.registration.findMany({
      where: { userId },
      include: {
        tournament: {
          include: {
            organization: true,
            game: true
          }
        },
        category: true,
        team: {
          include: {
            captain: true,
            members: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        tournament: {
          startDate: 'desc'
        }
      }
    });

    // Get stats for each tournament
    const tournamentsWithStats = await Promise.all(
      registrations.map(async (reg) => {
        const matches = await this.getMyMatches(userId, 1000);
        const tournamentMatches = matches.filter(m => m.tournamentId === reg.tournamentId);
        
        const wins = tournamentMatches.filter(m => m.result === 'won').length;
        const losses = tournamentMatches.filter(m => m.result === 'lost').length;

        return {
          ...reg,
          stats: {
            matchesPlayed: tournamentMatches.length,
            wins,
            losses
          }
        };
      })
    );

    return tournamentsWithStats;
  }

  // ==========================================
  // 7. NOTIFICATIONS
  // ==========================================

  async getMyNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markNotificationAsRead(userId: number, notificationId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Not your notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { delivered: true }
    });
  }

  private async createNotification(userId: number, type: string, payload: any) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        payload
      }
    });
  }

  // ==========================================
  // 8. PLAYER PROFILES
  // ==========================================

  async createPlayerProfile(userId: number, createProfileDto: CreatePlayerProfileDto) {
    const existingProfile = await this.prisma.playerProfile.findUnique({
      where: {
        userId_gameId: {
          userId: userId,
          gameId: createProfileDto.gameId
        }
      }
    });

    if (existingProfile) {
      throw new BadRequestException('Profile already exists for this game');
    }

    return this.prisma.playerProfile.create({
      data: {
        userId,
        ...createProfileDto
      },
      include: {
        game: true
      }
    });
  }

  async updatePlayerProfile(userId: number, gameId: number, updateProfileDto: UpdatePlayerProfileDto) {
    return this.prisma.playerProfile.update({
      where: {
        userId_gameId: {
          userId,
          gameId
        }
      },
      data: updateProfileDto,
      include: {
        game: true
      }
    });
  }

  async getPlayerProfiles(userId: number) {
    return this.prisma.playerProfile.findMany({
      where: { userId },
      include: {
        game: true,
        playerStats: {
          include: {
            tournament: true,
            category: true
          }
        }
      }
    });
  }

  // ==========================================
  // 9. UTILITY METHODS
  // ==========================================

  async getAllGames() {
    return this.prisma.game.findMany({
      select: {
        id: true,
        key: true,
        name: true
      }
    });
  }
}
