export class CreateTeamDto {
  tournamentId: number;
  categoryId: number;
  name: string;
}

export class InviteTeamMemberDto {
  teamId: number;
  userId: number;
}

export class RespondToTeamInviteDto {
  teamId: number;
  action: 'accept' | 'reject';
}

export class UpdateTeamDto {
  name?: string;
  captainUserId?: number;
}

export class RemoveTeamMemberDto {
  teamId: number;
  userId: number; // User to remove from team
}

export class LeaveTeamDto {
  teamId: number;
}