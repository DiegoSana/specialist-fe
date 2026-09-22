import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: WrapperProps) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+5491155551234',
  profilePictureUrl: null,
  isAdmin: false,
  status: 'ACTIVE',
  hasClientProfile: true,
  hasProfessionalProfile: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockProfessional = (overrides = {}) => ({
  id: 'prof-123',
  userId: 'user-123',
  trades: [{ id: 'trade-1', name: 'Electricista', category: 'Hogar', description: null, isPrimary: true }],
  description: 'Experienced professional',
  experienceYears: 5,
  status: 'VERIFIED',
  zone: 'Centro',
  city: 'Bariloche',
  address: 'Main Street 123',
  whatsapp: '+5491155551234',
  website: 'https://professional.com',
  averageRating: 4.5,
  totalReviews: 10,
  profileImage: null,
  gallery: [],
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockRequest = (overrides = {}) => ({
  id: 'request-123',
  clientId: 'user-123',
  professionalId: 'prof-123',
  tradeId: 'trade-123',
  isPublic: false,
  description: 'Test description',
  address: 'Test Address 123',
  availability: 'Monday to Friday',
  photos: [],
  status: 'PUBLISHED',
  quoteAmount: null,
  quoteNotes: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockTrade = (overrides = {}) => ({
  id: 'trade-123',
  name: 'Electricista',
  category: 'Hogar',
  description: 'Servicios eléctricos',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockReview = (overrides = {}) => ({
  id: 'review-123',
  reviewerId: 'user-123',
  professionalId: 'prof-123',
  requestId: 'request-123',
  rating: 5,
  comment: 'Great service!',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

