export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class UpdateProfileDto {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}
