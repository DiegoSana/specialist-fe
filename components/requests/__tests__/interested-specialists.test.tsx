import { render, screen, fireEvent, within } from '@testing-library/react';
import InterestedSpecialists from '../interested-specialists';
import { useRequestInterests, useAssignProfessional } from '@/hooks/use-requests';
import { useSearchProviders } from '@/hooks/use-providers';

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) =>
    [...namespace.split('.'), ...key.split('.')].reduce(
      (node: any, part) => node?.[part],
      require('@/messages/es.json'),
    ),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'es' }),
}));

jest.mock('@/hooks/use-requests', () => ({
  useRequestInterests: jest.fn(),
  useAssignProfessional: jest.fn(),
}));

jest.mock('@/hooks/use-providers', () => ({
  useSearchProviders: jest.fn(),
}));

jest.mock('@/components/providers/provider-detail-modal', () => ({
  __esModule: true,
  default: ({ provider, showCreateRequestCta, onClose }: any) => (
    <div data-testid="mock-provider-detail-modal">
      <span>{provider.displayName}</span>
      <span data-testid="show-create-request-cta">{String(showCreateRequestCta)}</span>
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

const mockUseRequestInterests = useRequestInterests as jest.Mock;
const mockUseAssignProfessional = useAssignProfessional as jest.Mock;
const mockUseSearchProviders = useSearchProviders as jest.Mock;

const interest = (overrides: any = {}) => ({
  id: 'interest-1',
  serviceProviderId: 'sp-1',
  createdAt: '2026-09-20T00:00:00.000Z',
  message: null,
  provider: { id: 'sp-1', type: 'PROFESSIONAL', displayName: 'Juan Pérez', averageRating: 0, totalReviews: 0 },
  ...overrides,
});

const catalogProvider = (overrides: any = {}) => ({
  id: 'prof-1',
  serviceProviderId: 'sp-1',
  type: 'PROFESSIONAL',
  displayName: 'Juan Pérez',
  description: 'Electricista',
  city: 'Bariloche',
  zone: null,
  averageRating: 0,
  totalReviews: 0,
  profileImage: null,
  trades: [],
  hasVerifiedBadge: false,
  ...overrides,
});

describe('InterestedSpecialists', () => {
  beforeEach(() => {
    mockUseAssignProfessional.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    mockUseSearchProviders.mockReturnValue({ data: [catalogProvider()] });
  });

  it('does not show the detail popup by default', () => {
    mockUseRequestInterests.mockReturnValue({ data: [interest()], isLoading: false });
    render(<InterestedSpecialists requestId="req-1" />);
    expect(screen.queryByTestId('mock-provider-detail-modal')).toBeNull();
  });

  it('opens the detail popup, without the Crear solicitud CTA, when "Ver perfil" is clicked', () => {
    mockUseRequestInterests.mockReturnValue({ data: [interest()], isLoading: false });
    render(<InterestedSpecialists requestId="req-1" />);

    fireEvent.click(screen.getByTestId('view-profile-button'));

    const modal = screen.getByTestId('mock-provider-detail-modal');
    expect(within(modal).getByText('Juan Pérez')).toBeTruthy();
    expect(within(modal).getByTestId('show-create-request-cta').textContent).toBe('false');
  });

  it('closes the popup when onClose fires', () => {
    mockUseRequestInterests.mockReturnValue({ data: [interest()], isLoading: false });
    render(<InterestedSpecialists requestId="req-1" />);

    fireEvent.click(screen.getByTestId('view-profile-button'));
    expect(screen.getByTestId('mock-provider-detail-modal')).toBeTruthy();

    fireEvent.click(screen.getByText('close'));
    expect(screen.queryByTestId('mock-provider-detail-modal')).toBeNull();
  });

  it('still renders the Elegir button unchanged alongside the new Ver perfil button', () => {
    mockUseRequestInterests.mockReturnValue({ data: [interest()], isLoading: false });
    render(<InterestedSpecialists requestId="req-1" />);
    expect(screen.getByText('Elegir')).toBeTruthy();
    expect(screen.getByText('Ver perfil')).toBeTruthy();
  });
});
