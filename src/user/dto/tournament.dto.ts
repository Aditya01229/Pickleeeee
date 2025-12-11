export class CreateTournamentDto {
  // orgId removed - now comes from URL param
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
  // tournamentId removed - now comes from URL param
  name: string;
  key: string;
  entryType: 'INDIVIDUAL' | 'TEAM';
  entryLimit?: number;
  teamSize?: number; // Required for TEAM entryType, number of players per team
  regDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  courtsCount?: number;
  matchDurationMinutes?: number;
  bufferMinutes?: number;
  scoringMode?: string;
  settings?: any;
}

export class UpdateTournamentDto {
  gameId?: number;
  name?: string;
  slug?: string;
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

export class UpdateCategoryDto {
  name?: string;
  key?: string;
  entryType?: 'INDIVIDUAL' | 'TEAM';
  entryLimit?: number;
  teamSize?: number; // Required for TEAM entryType, number of players per team
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

export class PayRegistrationDto {
  registrationId: number;
  paymentInfo?: any; // Payment details (transaction ID, method, etc.)
}
