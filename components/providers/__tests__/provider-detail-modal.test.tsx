import { render, screen, fireEvent } from '@testing-library/react';
import ProviderDetailModal from '../provider-detail-modal';
import { UnifiedProvider } from '@/hooks/use-providers';

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) =>
    [...namespace.split('.'), ...key.split('.')].reduce(
      (node: any, part) => node?.[part],
      require('@/messages/es.json'),
    ),
}));

const useServiceProviderReviews = jest.fn(() => ({ data: [] as unknown[] }));
jest.mock('@/hooks/use-reviews', () => ({
  useServiceProviderReviews: (...args: unknown[]) => useServiceProviderReviews(...args),
}));

jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(() => false),
}));

const provider = (overrides: Partial<UnifiedProvider> = {}): UnifiedProvider => ({
  id: 'prof-1',
  serviceProviderId: 'sp-1',
  type: 'PROFESSIONAL',
  displayName: 'Juan Pérez',
  description: 'Electricista con 10 años de experiencia',
  city: 'Bariloche',
  zone: 'Centro',
  averageRating: 4.5,
  totalReviews: 3,
  profileImage: null,
  trades: [{ id: 't1', name: 'Electricidad', isPrimary: true }],
  hasVerifiedBadge: true,
  ...overrides,
});

describe('ProviderDetailModal', () => {
  beforeEach(() => {
    useServiceProviderReviews.mockReturnValue({ data: [] });
  });

  it('shows the provider name and info', () => {
    render(<ProviderDetailModal provider={provider()} locale="es" onClose={jest.fn()} />);
    expect(screen.getByText('Juan Pérez')).toBeTruthy();
    expect(screen.getByText('Electricidad')).toBeTruthy();
  });

  it('shows the "Crear solicitud" CTA by default (public catalog context)', () => {
    render(<ProviderDetailModal provider={provider()} locale="es" onClose={jest.fn()} />);
    expect(screen.getByRole('link', { name: /crear solicitud/i })).toBeTruthy();
  });

  it('hides the "Crear solicitud" CTA when showCreateRequestCta is false (interested-specialists context)', () => {
    render(
      <ProviderDetailModal provider={provider()} locale="es" onClose={jest.fn()} showCreateRequestCta={false} />,
    );
    expect(screen.queryByRole('link', { name: /crear solicitud/i })).toBeNull();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<ProviderDetailModal provider={provider()} locale="es" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the reviews section for a COMPANY provider too (ServiceProvider.reviews is shared)', () => {
    render(
      <ProviderDetailModal
        provider={provider({ type: 'COMPANY', companyName: 'Acme SRL' })}
        locale="es"
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /Reseñas/ })).toBeTruthy();
  });

  it('fetches reviews by serviceProviderId (GET /providers/:serviceProviderId/reviews), not the profile id, for both types', () => {
    render(
      <ProviderDetailModal
        provider={provider({ id: 'company-1', serviceProviderId: 'sp-99', type: 'COMPANY' })}
        locale="es"
        onClose={jest.fn()}
      />,
    );
    expect(useServiceProviderReviews).toHaveBeenCalledWith('sp-99');
  });

  it('renders real review data for a COMPANY provider when logged in', () => {
    jest.requireMock('@/lib/auth').isAuthenticated.mockReturnValue(true);
    useServiceProviderReviews.mockReturnValue({
      data: [
        {
          id: 'rev-1',
          rating: 5,
          comment: 'Excelente trabajo',
          createdAt: '2026-01-01T00:00:00.000Z',
          reviewer: { id: 'u1', firstName: 'Ana', lastName: 'Gómez' },
        },
      ],
    });
    render(
      <ProviderDetailModal
        provider={provider({ type: 'COMPANY', companyName: 'Acme SRL' })}
        locale="es"
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('Excelente trabajo')).toBeTruthy();
    expect(screen.getByText('Ana Gómez')).toBeTruthy();
  });
});
