import { render, screen, fireEvent, within } from '@testing-library/react';
import InterestedSpecialists from '../interested-specialists';
import { useRequestInterests, useAssignProfessional } from '@/hooks/use-requests';
import { useProviderById } from '@/hooks/use-providers';

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
  useProviderById: jest.fn(),
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
const mockUseProviderById = useProviderById as jest.Mock;

const interest = (overrides: any = {}) => ({
  id: 'interest-1',
  serviceProviderId: 'sp-1',
  createdAt: '2026-09-20T00:00:00.000Z',
  message: null,
  provider: { id: 'prof-1', type: 'PROFESSIONAL', displayName: 'Juan Pérez', averageRating: 0, totalReviews: 0 },
  ...overrides,
});

const fullProvider = (overrides: any = {}) => ({
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
    // Default: whatever id/type is requested, return a provider matching it — tests override
    // per-case to assert the hook was called with the right (id, type) pair.
    mockUseProviderById.mockImplementation((id: string | null) => ({
      data: id ? fullProvider({ id }) : undefined,
    }));
  });

  it('does not show the detail popup by default', () => {
    mockUseRequestInterests.mockReturnValue({ data: [interest()], isLoading: false });
    render(<InterestedSpecialists requestId="req-1" />);
    expect(screen.queryByTestId('mock-provider-detail-modal')).toBeNull();
    // Not enabled until a row is opened.
    expect(mockUseProviderById).toHaveBeenCalledWith(null, null, { enabled: false });
  });

  it('opens the detail popup, without the Crear solicitud CTA, when "Ver perfil" is clicked', () => {
    mockUseRequestInterests.mockReturnValue({ data: [interest()], isLoading: false });
    render(<InterestedSpecialists requestId="req-1" />);

    fireEvent.click(screen.getByTestId('view-profile-button'));

    expect(mockUseProviderById).toHaveBeenLastCalledWith('prof-1', 'PROFESSIONAL', { enabled: true });
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

  it('opens the correct provider for a row that is NOT the first in the list — regression for the bug where only the first interested specialist\'s popup ever opened', () => {
    // Before the fix this depended on a shared GET /providers catalog search + client-side
    // .find() by serviceProviderId: a specialist filtered out of that catalog (not yet
    // catalog-active, or visibility toggled off after expressing interest) would never be
    // found, so clicking any row but a catalog-active first one silently did nothing.
    const interests = [
      interest({
        id: 'interest-1',
        serviceProviderId: 'sp-1',
        provider: { id: 'prof-1', type: 'PROFESSIONAL', displayName: 'Primero', averageRating: 0, totalReviews: 0 },
      }),
      interest({
        id: 'interest-2',
        serviceProviderId: 'sp-2',
        provider: { id: 'comp-2', type: 'COMPANY', displayName: 'Segunda Empresa', averageRating: 0, totalReviews: 0 },
      }),
    ];
    mockUseRequestInterests.mockReturnValue({ data: interests, isLoading: false });
    mockUseProviderById.mockImplementation((id: string | null, type: string | null) => ({
      data:
        id && type
          ? fullProvider({
              id,
              type,
              displayName: id === 'comp-2' ? 'Segunda Empresa' : 'Primero',
            })
          : undefined,
    }));

    render(<InterestedSpecialists requestId="req-1" />);

    const buttons = screen.getAllByTestId('view-profile-button');
    expect(buttons).toHaveLength(2);

    // Click the SECOND row's "Ver perfil" — this is the one that was broken.
    fireEvent.click(buttons[1]);

    expect(mockUseProviderById).toHaveBeenLastCalledWith('comp-2', 'COMPANY', { enabled: true });
    const modal = screen.getByTestId('mock-provider-detail-modal');
    expect(within(modal).getByText('Segunda Empresa')).toBeTruthy();
  });

  it('hides the "Ver perfil" button when an interest row has no provider id/type', () => {
    mockUseRequestInterests.mockReturnValue({ data: [interest({ provider: undefined })], isLoading: false });
    render(<InterestedSpecialists requestId="req-1" />);
    expect(screen.queryByTestId('view-profile-button')).toBeNull();
  });
});
