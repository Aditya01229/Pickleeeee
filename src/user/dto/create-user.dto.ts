export class CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export class LoginDto {
  email: string;
}

export class UpdateProfileDto {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}
