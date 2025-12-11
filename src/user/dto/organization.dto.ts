export class JoinOrganizationDto {
  organizationId: number;
  role?: 'super_manager' | 'manager' | 'follower';
}

export class CreateOrganizationDto {
  name: string;
  slug: string;
  defaultGameId?: number;
  branding?: any;
}
