export class CreateTournamentDto {
  orgId: number;
  gameId: number;
  name: string;
  slug: string;
  description?: string;
  regDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  courtsCount?: number;
  matchDurationMinutes?: number;
  bufferMinutes?: number;
  scoringMode?: string;
  settings?: any;
}

export class AddCategoryDto {
  tournamentId: number;
  name: string;
  key: string;
  entryType: 'INDIVIDUAL' | 'TEAM';
  entryLimit?: number;
  regDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  courtsCount?: number;
  matchDurationMinutes?: number;
  bufferMinutes?: number;
  scoringMode?: string;
  settings?: any;
}

export class RegisterTournamentDto {
  tournamentId: number;
  categoryId: number;
  teamId?: number; // Only for team categories
}
