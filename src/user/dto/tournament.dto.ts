import { IsEnum, IsString, IsNumber, IsOptional, IsDateString, IsObject } from 'class-validator';

export enum EntryType {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
}

export class CreateTournamentDto {
  // orgId removed - now comes from URL param
  @IsNumber()
  gameId: number;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  regDeadline?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  courtsCount?: number;

  @IsOptional()
  @IsNumber()
  matchDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  bufferMinutes?: number;

  @IsOptional()
  @IsString()
  scoringMode?: string;

  @IsOptional()
  @IsObject()
  settings?: any;
}

export class AddCategoryDto {
  // tournamentId removed - now comes from URL param
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsEnum(EntryType, {
    message: 'entryType must be either INDIVIDUAL or TEAM',
  })
  entryType: EntryType;

  @IsOptional()
  @IsNumber()
  entryLimit?: number;

  @IsOptional()
  @IsNumber()
  teamSize?: number; // Required for TEAM entryType, number of players per team

  @IsOptional()
  @IsDateString()
  regDeadline?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  courtsCount?: number;

  @IsOptional()
  @IsNumber()
  matchDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  bufferMinutes?: number;

  @IsOptional()
  @IsString()
  scoringMode?: string;

  @IsOptional()
  @IsObject()
  settings?: any;
}

export class UpdateTournamentDto {
  @IsOptional()
  @IsNumber()
  gameId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  regDeadline?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  courtsCount?: number;

  @IsOptional()
  @IsNumber()
  matchDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  bufferMinutes?: number;

  @IsOptional()
  @IsString()
  scoringMode?: string;

  @IsOptional()
  @IsObject()
  settings?: any;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsEnum(EntryType, {
    message: 'entryType must be either INDIVIDUAL or TEAM',
  })
  entryType?: EntryType;

  @IsOptional()
  @IsNumber()
  entryLimit?: number;

  @IsOptional()
  @IsNumber()
  teamSize?: number; // Required for TEAM entryType, number of players per team

  @IsOptional()
  @IsDateString()
  regDeadline?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  courtsCount?: number;

  @IsOptional()
  @IsNumber()
  matchDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  bufferMinutes?: number;

  @IsOptional()
  @IsString()
  scoringMode?: string;

  @IsOptional()
  @IsObject()
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
