export class CreatePlayerProfileDto {
  gameId: number;
  rating?: number;
  meta?: any;
}

export class UpdatePlayerProfileDto {
  rating?: number;
  meta?: any;
}
