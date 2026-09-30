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
  whatsappOptedOut: boolean;
  whatsappOptedOutAt: string | null;
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
// Mirrors specialist-be `RequestStatus` (prisma enum). Main path: DRAFT -> PUBLISHED (bolsa) |
// SENT (directo) -> CONTACT_RELEASED -> IN_PROGRESS -> FINISHED -> CLOSED, with UNDER_REVIEW as a
// support-handled detour from FINISHED. Terminal alternates: EXPIRED, NO_RESPONSE, REJECTED,
// CANCELLED, NOT_COMPLETED, INTERRUPTED, ABANDONED. Presentation lives in lib/request-status.ts.
export enum RequestStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SENT = 'SENT',
  CONTACT_RELEASED = 'CONTACT_RELEASED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CLOSED = 'CLOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EXPIRED = 'EXPIRED',
  NO_RESPONSE = 'NO_RESPONSE',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  NOT_COMPLETED = 'NOT_COMPLETED',
  INTERRUPTED = 'INTERRUPTED',
  ABANDONED = 'ABANDONED',
}

// Per-specialist state on a public ("bolsa") request; mirrors specialist-be `RequestInterestStatus`.
export enum RequestInterestStatus {
  INTERESTED = 'INTERESTED',
  CHOSEN = 'CHOSEN',
  NOT_CHOSEN = 'NOT_CHOSEN',
  WITHDRAWN = 'WITHDRAWN',
}

// Reviews (bidirectional: CLIENT_TO_PROVIDER and PROVIDER_TO_CLIENT — see REVIEWS_REDESIGN.md).
// Mirrors specialist-be `ReviewStatus` (prisma enum, moderation state).
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * A review's own content, as embedded in `Request.myReview` / `Request.counterpartReview`
 * (`RequestReviewSummaryDto` on the backend). `revealedAt` is null until both parties rated or
 * the reveal timeout elapsed (doble-ciego con timeout) — only relevant for `counterpartReview`,
 * since the author can always see their own review via `myReview`.
 */
export interface RequestReviewSummary {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  revealedAt: string | null;
  createdAt: string;
}

/** `counterpartReview` before it's revealed: content hidden, only existence shown. */
export interface PendingCounterpartReview {
  pending: true;
}

export function isPendingReview(
  review: RequestReviewSummary | PendingCounterpartReview | null | undefined,
): review is PendingCounterpartReview {
  return !!review && 'pending' in review && review.pending === true;
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
  isVisible: boolean; // Whether this professional appears in public search/listing results
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
    // Only returned once contact was released for this request (RequestEntity.canViewCounterpartContactBy).
    phone?: string;
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
  /**
   * @deprecated Legacy flat field: client rating by professional. Read-only compat for requests
   * closed before the bidirectional reviews redesign (no longer written by
   * `POST /requests/:id/rate-client`) — use `myReview`/`counterpartReview` instead.
   */
  clientRating?: number | null;
  /** @deprecated See clientRating. */
  clientRatingComment?: string | null;
  /**
   * The viewer's own review for this request (client's review of the provider, or provider's
   * review of the client, depending on who is asking). Always visible to its author regardless
   * of reveal state. Only populated on single-request detail responses (GET/PATCH /requests/:id,
   * POST /requests/:id/rate-client) — undefined on list endpoints.
   */
  myReview?: RequestReviewSummary | null;
  /**
   * The counterpart's review. Hidden behind `{ pending: true }` until both parties rated or the
   * reveal timeout elapsed (doble-ciego con timeout). Only populated on single-request detail
   * responses — undefined on list endpoints.
   */
  counterpartReview?: RequestReviewSummary | PendingCounterpartReview | null;
  // Reason for NOT_COMPLETED / INTERRUPTED (or a support resolution note).
  statusReason?: string | null;
  // Specialists currently INTERESTED; only present on the client's list response.
  interestsCount?: number;
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
      // Only returned once contact was released for this request (RequestEntity.canViewCounterpartContactBy).
      phone?: string;
    };
  };
  trade?: Trade;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
    // Only returned once contact was released for this request (RequestEntity.canViewCounterpartContactBy).
    phone?: string;
    /** Client aggregate rating from PROVIDER_TO_CLIENT reviews. */
    averageRating?: number;
    totalReviews?: number;
    /**
     * Admin-curated (isFeatured) approved reviews of this client, for the provider-facing
     * "in context" view (no dedicated client profile page — REVIEWS_REDESIGN.md section 2).
     * Only populated on single-request detail responses (GET/PATCH /requests/:id,
     * POST /requests/:id/rate-client) — undefined on list endpoints, including
     * `InterestedRequest.fullRequest`.
     */
    featuredReviews?: RequestReviewSummary[];
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
  /** Reason for NOT_COMPLETED / INTERRUPTED (max 500 chars). */
  statusReason?: string;
}

// Request Interest types (for public requests)
// RequestInterest is now an alias for InterestedProvider to maintain backward compatibility
export interface RequestInterest extends InterestedProvider {}

// Item of GET /requests/interested: a public request where the current specialist showed interest.
export interface InterestedRequest {
  interestId: string;
  interestCreatedAt: string;
  interestStatus: RequestInterestStatus;
  interestMessage: string | null;
  requestId: string;
  title: string;
  description: string;
  status: RequestStatus;
  requestCreatedAt: string;
  assignedToOther: boolean;
  assignedToMe: boolean;
  fullRequest?: Request;
}

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
  ACTIVE = 'ACTIVE',
  VERIFIED = 'VERIFIED',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
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
  isVisible: boolean; // Whether this company appears in public search/listing results
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
  isVisible?: boolean;
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
  /** INTERESTED / CHOSEN / NOT_CHOSEN / WITHDRAWN (client-facing list excludes WITHDRAWN). */
  status?: RequestInterestStatus;
  createdAt: string;
  provider?: {
    id: string;
    type: ProviderType;
    displayName: string;
    profileImage?: string;
    averageRating: number;
    totalReviews: number;
    // No phone/whatsapp here: contact is only released once the client chooses this
    // provider (status CONTACT_RELEASED), so the backend never sends it on an interest.
  };
}
