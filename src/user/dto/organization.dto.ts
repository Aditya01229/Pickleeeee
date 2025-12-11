import { IsNumber, IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class JoinOrganizationDto {
  @IsNumber()
  organizationId: number;

  @IsOptional()
  @IsEnum(['super_manager', 'manager', 'follower'], {
    message: 'role must be one of: super_manager, manager, follower',
  })
  role?: 'super_manager' | 'manager' | 'follower';
}

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsNumber()
  defaultGameId?: number;

  @IsOptional()
  @IsObject()
  branding?: any;
}
