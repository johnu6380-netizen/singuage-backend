// backend/src/types/index.ts

import { Request } from 'express';

export interface RegisterDTO {
  email: string;
  password: string;
  displayName?: string;
  nativeLanguage?: string;
  targetLanguages?: string[];
  isAdult?: boolean;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email?: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  nativeLanguage: string;
  targetLanguages: any; // stored as JSON in Prisma
  preferredArtists: string[]; // ADDED: Missing field
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  isAdult: boolean;
  createdAt: string;
}

// A convenience type for handlers that need the authenticated user
export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
  };
};
