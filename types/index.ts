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
  hasCompanyProfile: boolean;
  isAdmin: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
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
  professionalId?: string; // Optional for public requests (deprecated, use providerId)
  providerId?: string | null; // ServiceProvider ID (Professional or Company)
  tradeId?: string; // Trade for public requests
  isPublic: boolean;
  title: string; // Request title for display
  description: string;
  address?: string;
  availability?: string;
  photos?: string[];
  status: RequestStatus;
  quoteAmount?: number;
  quoteNotes?: string;
  // Client rating by professional
  clientRating?: number;
  clientRatingComment?: string;
  createdAt: string;
  updatedAt: string;
  professional?: Professional;
  company?: {
    id: string;
    userId: string;
    serviceProviderId: string;
    companyName: string;
    legalName?: string;
    taxId?: string;
    description?: string;
    foundedYear?: number;
    employeeCount?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    city: string;
    zone?: string;
    status: string;
    averageRating: number;
    totalReviews: number;
    profileImage?: string;
    gallery: string[];
    active: boolean;
    trades: Array<{
      id: string;
      name: string;
      category: string | null;
      description: string | null;
      isPrimary: boolean;
    }>;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
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
  professionalId?: string; // Required for direct requests to professionals
  companyId?: string; // Required for direct requests to companies
  tradeId?: string; // Required for public requests
  isPublic?: boolean;
  title: string; // Request title
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
// RequestInterest is now an alias for InterestedProvider to maintain backward compatibility
export interface RequestInterest extends InterestedProvider {}

export interface ExpressInterestDto {
  message?: string;
}

export interface AssignProfessionalDto {
  professionalId: string;
}

export interface AssignProviderDto {
  serviceProviderId: string;
}

// ==================== COMPANY TYPES ====================

export enum CompanyStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ProviderType {
  PROFESSIONAL = 'PROFESSIONAL',
  COMPANY = 'COMPANY',
}

export interface CompanyTrade {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  isPrimary: boolean;
}

export interface Company {
  id: string;
  userId: string;
  serviceProviderId: string;
  companyName: string;
  legalName?: string;
  taxId?: string;
  trades: CompanyTrade[];
  description?: string;
  foundedYear?: number;
  employeeCount?: string; // "1-5", "6-20", "21-50", "50+"
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city: string;
  zone?: string;
  profileImage?: string;
  gallery: string[];
  status: CompanyStatus;
  active: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  primaryTrade?: CompanyTrade;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

export interface CreateCompanyDto {
  companyName: string;
  legalName?: string;
  taxId?: string;
  description?: string;
  foundedYear?: number;
  employeeCount?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  zone?: string;
  profileImage?: string;
  gallery?: string[];
  trades: Array<{ id: string; isPrimary?: boolean }>;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {
  status?: CompanyStatus;
  active?: boolean;
}

export interface SearchCompaniesParams {
  search?: string;
  tradeId?: string;
  city?: string;
  status?: CompanyStatus;
  active?: boolean;
}

// Updated RequestInterest to support both Professional and Company
export interface InterestedProvider {
  id: string;
  requestId: string;
  serviceProviderId: string;
  /** @deprecated Use serviceProviderId */
  professionalId: string;
  message?: string;
  createdAt: string;
  provider?: {
    id: string;
    type: ProviderType;
    displayName: string;
    profileImage?: string;
    averageRating: number;
    totalReviews: number;
    whatsapp?: string | null;
    phone?: string | null;
  };
}
