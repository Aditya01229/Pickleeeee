// src/user/user.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query,
  ParseIntPipe 
} from '@nestjs/common';
import { UserService } from './user.service';
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
  CreateTournamentDto,
  AddCategoryDto,
  RegisterTournamentDto
} from './dto/tournament.dto';
import {
  CreateTeamDto,
  InviteTeamMemberDto,
  RespondToTeamInviteDto,
  UpdateTeamDto
} from './dto/team.dto';
import {
  CreatePlayerProfileDto,
  UpdatePlayerProfileDto
} from './dto/player-profile.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // ==========================================
  // 1. AUTHENTICATION & USER MANAGEMENT
  // ==========================================

  /**
   * Register a new user
   * POST /users/register
   */
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  /**
   * Login user
   * POST /users/login
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  /**
   * Get current user profile
   * GET /users/:userId/profile
   */
  @Get(':userId/profile')
  getProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getProfile(userId);
  }

  /**
   * Update current user profile
   * PUT /users/:userId/profile
   */
  @Put(':userId/profile')
  updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.userService.updateProfile(userId, updateProfileDto);
  }

  // ==========================================
  // 2. ORGANIZATION MANAGEMENT
  // ==========================================

  /**
   * Create new organization (user becomes manager)
   * POST /users/:userId/organizations
   */
  @Post(':userId/organizations')
  createOrganization(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createOrgDto: CreateOrganizationDto
  ) {
    return this.userService.createOrganization(userId, createOrgDto);
  }

  /**
   * Join an existing organization
   * POST /users/:userId/organizations/join
   */
  @Post(':userId/organizations/join')
  joinOrganization(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() joinOrgDto: JoinOrganizationDto
  ) {
    return this.userService.joinOrganization(userId, joinOrgDto);
  }

  /**
   * Get all organizations user belongs to
   * GET /users/:userId/organizations
   */
  @Get(':userId/organizations')
  getUserOrganizations(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getUserOrganizations(userId);
  }

  // ==========================================
  // 3. TOURNAMENT MANAGEMENT (MANAGER)
  // ==========================================

  /**
   * Create a new tournament (manager only)
   * POST /users/:userId/tournaments
   */
  @Post(':userId/tournaments')
  createTournament(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createTournamentDto: CreateTournamentDto
  ) {
    return this.userService.createTournament(userId, createTournamentDto);
  }

  /**
   * Add category to tournament (manager only)
   * POST /users/:userId/tournaments/categories
   */
  @Post(':userId/tournaments/categories')
  addTournamentCategory(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() addCategoryDto: AddCategoryDto
  ) {
    return this.userService.addTournamentCategory(userId, addCategoryDto);
  }

  /**
   * Get all tournaments hosted by user (manager)
   * GET /users/:userId/tournaments/hosted
   */
  @Get(':userId/tournaments/hosted')
  getHostedTournaments(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getHostedTournaments(userId);
  }

  // ==========================================
  // 4. TOURNAMENT REGISTRATION (PLAYER)
  // ==========================================

  /**
   * Register for a tournament (individual or team)
   * POST /users/:userId/registrations
   */
  @Post(':userId/registrations')
  registerForTournament(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() registerDto: RegisterTournamentDto
  ) {
    return this.userService.registerForTournament(userId, registerDto);
  }

  /**
   * Get all user's tournament registrations
   * GET /users/:userId/registrations
   */
  @Get(':userId/registrations')
  getMyRegistrations(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getMyRegistrations(userId);
  }

  /**
   * Get tournament participation history
   * GET /users/:userId/tournaments/history
   */
  @Get(':userId/tournaments/history')
  getTournamentHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getTournamentHistory(userId);
  }

  // ==========================================
  // 5. TEAM MANAGEMENT
  // ==========================================

  /**
   * Create a new team (user becomes captain)
   * POST /users/:userId/teams
   */
  @Post(':userId/teams')
  createTeam(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createTeamDto: CreateTeamDto
  ) {
    return this.userService.createTeam(userId, createTeamDto);
  }

  /**
   * Invite member to team (captain only)
   * POST /users/:userId/teams/invite
   */
  @Post(':userId/teams/invite')
  inviteTeamMember(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() inviteDto: InviteTeamMemberDto
  ) {
    return this.userService.inviteTeamMember(userId, inviteDto);
  }

  /**
   * Respond to team invitation (accept/reject)
   * POST /users/:userId/teams/respond
   */
  @Post(':userId/teams/respond')
  respondToTeamInvite(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() respondDto: RespondToTeamInviteDto
  ) {
    return this.userService.respondToTeamInvite(userId, respondDto);
  }

  /**
   * Get all teams user is part of (captain or member)
   * GET /users/:userId/teams
   */
  @Get(':userId/teams')
  getMyTeams(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getMyTeams(userId);
  }

  /**
   * Get pending team invitations
   * GET /users/:userId/teams/invites
   */
  @Get(':userId/teams/invites')
  getTeamInvites(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getTeamInvites(userId);
  }

  // ==========================================
  // 6. MATCH HISTORY & STATS
  // ==========================================

  /**
   * Get all matches user played in
   * GET /users/:userId/matches?limit=50
   */
  @Get(':userId/matches')
  getMyMatches(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.userService.getMyMatches(userId, limitNum);
  }

  /**
   * Get user's overall stats
   * GET /users/:userId/stats?tournamentId=100
   */
  @Get(':userId/stats')
  getMyStats(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('tournamentId') tournamentId?: string
  ) {
    const tournamentIdNum = tournamentId ? parseInt(tournamentId) : undefined;
    return this.userService.getMyStats(userId, tournamentIdNum);
  }

  // ==========================================
  // 7. NOTIFICATIONS
  // ==========================================

  /**
   * Get all user notifications
   * GET /users/:userId/notifications
   */
  @Get(':userId/notifications')
  getMyNotifications(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getMyNotifications(userId);
  }

  /**
   * Mark notification as read
   * PUT /users/:userId/notifications/:notificationId/read
   */
  @Put(':userId/notifications/:notificationId/read')
  markNotificationAsRead(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('notificationId', ParseIntPipe) notificationId: number
  ) {
    return this.userService.markNotificationAsRead(userId, notificationId);
  }

  // ==========================================
  // 8. PLAYER PROFILES
  // ==========================================

  /**
   * Create player profile for a game
   * POST /users/:userId/player-profiles
   */
  @Post(':userId/player-profiles')
  createPlayerProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createProfileDto: CreatePlayerProfileDto
  ) {
    return this.userService.createPlayerProfile(userId, createProfileDto);
  }

  /**
   * Update player profile for a game
   * PUT /users/:userId/player-profiles/:gameId
   */
  @Put(':userId/player-profiles/:gameId')
  updatePlayerProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() updateProfileDto: UpdatePlayerProfileDto
  ) {
    return this.userService.updatePlayerProfile(userId, gameId, updateProfileDto);
  }

  /**
   * Get all player profiles for user
   * GET /users/:userId/player-profiles
   */
  @Get(':userId/player-profiles')
  getPlayerProfiles(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getPlayerProfiles(userId);
  }

  // ==========================================
  // 9. UTILITY ENDPOINTS
  // ==========================================

  /**
   * Get all available games
   * GET /users/games
   */
  @Get('games')
  getAllGames() {
    return this.userService.getAllGames();
  }
}
