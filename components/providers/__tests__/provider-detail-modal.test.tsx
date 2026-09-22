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

jest.mock('@/hooks/use-reviews', () => ({
  useProfessionalReviews: jest.fn(() => ({ data: [] })),
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
});
