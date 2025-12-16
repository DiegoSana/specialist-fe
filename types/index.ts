// Shared frontend types
// These types can be synchronized with backend DTOs

export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePictureUrl?: string;
  status: UserStatus;
  hasClientProfile: boolean;
  hasProfessionalProfile: boolean;
  isAdmin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string; // Phone is now required
  isProfessional?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Request types
export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export interface Trade {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface Professional {
  id: string;
  userId: string;
  trades: Array<{
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    isPrimary: boolean;
  }>;
  description?: string;
  experienceYears?: number;
  status: string;
  zone?: string;
  city: string;
  address?: string;
  whatsapp?: string;
  website?: string;
  averageRating: number;
  totalReviews: number;
  profileImage?: string;
  gallery: string[];
  combinedGallery?: string[]; // Gallery + completed work photos
  active: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
  };
}

export interface Request {
  id: string;
  clientId: string;
  professionalId?: string; // Optional for public requests
  tradeId?: string; // Trade for public requests
  isPublic: boolean;
  description: string;
  address?: string;
  availability?: string;
  photos?: string[];
  status: RequestStatus;
  quoteAmount?: number;
  quoteNotes?: string;
  createdAt: string;
  updatedAt: string;
  professional?: Professional;
  trade?: Trade;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
  };
}

export interface CreateRequestDto {
  professionalId?: string; // Required for direct requests
  tradeId?: string; // Required for public requests
  isPublic?: boolean;
  description: string;
  address?: string;
  availability?: string;
  photos?: string[];
}

export interface UpdateRequestDto {
  status?: RequestStatus;
  quoteAmount?: number;
  quoteNotes?: string;
}

// Request Interest types (for public requests)
export interface RequestInterest {
  id: string;
  requestId: string;
  professionalId: string;
  message?: string;
  createdAt: string;
  professional?: Professional;
}

export interface ExpressInterestDto {
  message?: string;
}

export interface AssignProfessionalDto {
  professionalId: string;
}
