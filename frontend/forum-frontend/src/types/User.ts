export type User = {
  id: number;
  email: string;
  username: string;
  role: string;
  isVerified: boolean;
  phone: string | null;
  mfaEnabled: boolean;
}