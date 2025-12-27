// Shared types for AgarthaLogin frontend

export interface User {
  uuid: string;
  username: string;
  premium: boolean;
  online: boolean;
  authorized?: boolean;
  has2fa: boolean;
  hashAlgo?: string;
  ip?: string;
  email?: string;
  lastSeen?: string;
  joinDate?: string;
  alts?: AltUser[];
}

export interface AltUser {
  uuid: string;
  username: string;
  lastSeen?: string;
}

export interface TokenInfo {
  username: string;
  type: 'LOGIN' | 'REGISTER' | 'ADMIN_ACCESS';
}

export interface SessionUser {
  username: string;
}

export type ViewState = 'loading' | 'login' | 'register' | 'prompt' | 'admin' | 'authorized' | 'error';

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface CheckPremiumResponse {
  isPremium: boolean;
}

export interface AdminApplyResponse {
  success: boolean;
  gameCode?: string;
  sessionId?: string;
  error?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface OptimizeResponse {
  preferredAlgo: string;
  usersNeedingConversion: number;
  message: string;
}
