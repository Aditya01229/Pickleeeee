export class JoinOrganizationDto {
  organizationId: number;
  role: 'manager' | 'player';
}

export class CreateOrganizationDto {
  name: string;
  slug: string;
  defaultGameId?: number;
  branding?: any;
}
