// src/user/user.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query,
  ParseIntPipe,
  UseGuards 
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/user.decorator';
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
  PayRegistrationDto
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
   * GET /users/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return this.userService.getProfile(user.userId);
  }

  /**
   * Update current user profile
   * PUT /users/profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.userService.updateProfile(user.userId, updateProfileDto);
  }

  // ==========================================
  // 2. ORGANIZATION MANAGEMENT
  // ==========================================

  /**
   * Create new organization (user becomes super_manager)
   * POST /users/organizations
   */
  @Post('organizations')
  @UseGuards(JwtAuthGuard)
  createOrganization(
    @CurrentUser() user: any,
    @Body() createOrgDto: CreateOrganizationDto
  ) {
    return this.userService.createOrganization(user.userId, createOrgDto);
  }

  /**
   * Join an existing organization
   * POST /users/organizations/join
   */
  @Post('organizations/join')
  @UseGuards(JwtAuthGuard)
  joinOrganization(
    @CurrentUser() user: any,
    @Body() joinOrgDto: JoinOrganizationDto
  ) {
    return this.userService.joinOrganization(user.userId, joinOrgDto);
  }

  /**
   * Get all organizations user belongs to
   * GET /users/organizations
   */
  @Get('organizations')
  @UseGuards(JwtAuthGuard)
  getUserOrganizations(@CurrentUser() user: any) {
    return this.userService.getUserOrganizations(user.userId);
  }

  // ==========================================
  // 3. TOURNAMENT REGISTRATION (PLAYER)
  // ==========================================

  /**
   * Register for a tournament (individual or team)
   * POST /users/registrations
   */
  @Post('registrations')
  @UseGuards(JwtAuthGuard)
  registerForTournament(
    @CurrentUser() user: any,
    @Body() registerDto: RegisterTournamentDto
  ) {
    return this.userService.registerForTournament(user.userId, registerDto);
  }

  /**
   * Get all user's tournament registrations
   * GET /users/registrations
   */
  @Get('registrations')
  @UseGuards(JwtAuthGuard)
  getMyRegistrations(@CurrentUser() user: any) {
    return this.userService.getMyRegistrations(user.userId);
  }

  /**
   * Pay registration fees (captain for teams, user for individual)
   * POST /users/registrations/pay
   */
  @Post('registrations/pay')
  @UseGuards(JwtAuthGuard)
  payRegistration(
    @CurrentUser() user: any,
    @Body() payDto: PayRegistrationDto
  ) {
    return this.userService.payRegistration(user.userId, payDto);
  }

  /**
   * Get tournament participation history
   * GET /users/tournaments/history
   */
  @Get('tournaments/history')
  @UseGuards(JwtAuthGuard)
  getTournamentHistory(@CurrentUser() user: any) {
    return this.userService.getTournamentHistory(user.userId);
  }

  // ==========================================
  // 5. TEAM MANAGEMENT
  // ==========================================

  /**
   * Create a new team (user becomes captain)
   * POST /users/teams
   */
  @Post('teams')
  @UseGuards(JwtAuthGuard)
  createTeam(
    @CurrentUser() user: any,
    @Body() createTeamDto: CreateTeamDto
  ) {
    return this.userService.createTeam(user.userId, createTeamDto);
  }

  /**
   * Invite member to team (captain only)
   * POST /users/teams/invite
   */
  @Post('teams/invite')
  @UseGuards(JwtAuthGuard)
  inviteTeamMember(
    @CurrentUser() user: any,
    @Body() inviteDto: InviteTeamMemberDto
  ) {
    return this.userService.inviteTeamMember(user.userId, inviteDto);
  }

  /**
   * Respond to team invitation (accept/reject)
   * POST /users/teams/respond
   */
  @Post('teams/respond')
  @UseGuards(JwtAuthGuard)
  respondToTeamInvite(
    @CurrentUser() user: any,
    @Body() respondDto: RespondToTeamInviteDto
  ) {
    return this.userService.respondToTeamInvite(user.userId, respondDto);
  }

  /**
   * Remove team member (captain only)
   * POST /users/teams/remove
   */
  @Post('teams/remove')
  @UseGuards(JwtAuthGuard)
  removeTeamMember(
    @CurrentUser() user: any,
    @Body() removeDto: RemoveTeamMemberDto
  ) {
    return this.userService.removeTeamMember(user.userId, removeDto);
  }

  /**
   * Leave a team (member can leave on their own)
   * POST /users/teams/leave
   */
  @Post('teams/leave')
  @UseGuards(JwtAuthGuard)
  leaveTeam(
    @CurrentUser() user: any,
    @Body() leaveDto: LeaveTeamDto
  ) {
    return this.userService.leaveTeam(user.userId, leaveDto);
  }

  /**
   * Get all teams user is part of (captain or member)
   * GET /users/teams
   */
  @Get('teams')
  @UseGuards(JwtAuthGuard)
  getMyTeams(@CurrentUser() user: any) {
    return this.userService.getMyTeams(user.userId);
  }

  /**
   * Get pending team invitations
   * GET /users/teams/invites
   */
  @Get('teams/invites')
  @UseGuards(JwtAuthGuard)
  getTeamInvites(@CurrentUser() user: any) {
    return this.userService.getTeamInvites(user.userId);
  }

  // ==========================================
  // 6. MATCH HISTORY & STATS
  // ==========================================

  /**
   * Get all matches user played in
   * GET /users/matches?limit=50
   */
  @Get('matches')
  @UseGuards(JwtAuthGuard)
  getMyMatches(
    @CurrentUser() user: any,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.userService.getMyMatches(user.userId, limitNum);
  }

  /**
   * Get user's overall stats
   * GET /users/stats?tournamentId=100
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(
    @CurrentUser() user: any,
    @Query('tournamentId') tournamentId?: string
  ) {
    const tournamentIdNum = tournamentId ? parseInt(tournamentId) : undefined;
    return this.userService.getMyStats(user.userId, tournamentIdNum);
  }

  // ==========================================
  // 7. NOTIFICATIONS
  // ==========================================

  /**
   * Get all user notifications
   * GET /users/notifications
   */
  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  getMyNotifications(@CurrentUser() user: any) {
    return this.userService.getMyNotifications(user.userId);
  }

  /**
   * Mark notification as read
   * PUT /users/notifications/:notificationId/read
   */
  @Put('notifications/:notificationId/read')
  @UseGuards(JwtAuthGuard)
  markNotificationAsRead(
    @CurrentUser() user: any,
    @Param('notificationId', ParseIntPipe) notificationId: number
  ) {
    return this.userService.markNotificationAsRead(user.userId, notificationId);
  }

  // ==========================================
  // 8. PLAYER PROFILES
  // ==========================================

  /**
   * Create player profile for a game
   * POST /users/player-profiles
   */
  @Post('player-profiles')
  @UseGuards(JwtAuthGuard)
  createPlayerProfile(
    @CurrentUser() user: any,
    @Body() createProfileDto: CreatePlayerProfileDto
  ) {
    return this.userService.createPlayerProfile(user.userId, createProfileDto);
  }

  /**
   * Update player profile for a game
   * PUT /users/player-profiles/:gameId
   */
  @Put('player-profiles/:gameId')
  @UseGuards(JwtAuthGuard)
  updatePlayerProfile(
    @CurrentUser() user: any,
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() updateProfileDto: UpdatePlayerProfileDto
  ) {
    return this.userService.updatePlayerProfile(user.userId, gameId, updateProfileDto);
  }

  /**
   * Get all player profiles for user
   * GET /users/player-profiles
   */
  @Get('player-profiles')
  @UseGuards(JwtAuthGuard)
  getPlayerProfiles(@CurrentUser() user: any) {
    return this.userService.getPlayerProfiles(user.userId);
  }

  // ==========================================
  // 9. UTILITY ENDPOINTS
  // ==========================================

  /**
   * Get all available games
   * GET /users/games
   */
  @Get('games')
  @UseGuards(JwtAuthGuard)
  getAllGames() {
    return this.userService.getAllGames();
  }
}
