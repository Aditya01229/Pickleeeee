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
