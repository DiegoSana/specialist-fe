import { fireEvent, render, screen } from '@testing-library/react';
import SpecialistDashboardPage from '../page';
import { RequestInterestStatus, RequestStatus } from '@/types';

const requests = [
  { id: '1', title: 'Enviado uno', status: RequestStatus.SENT },
  { id: '2', title: 'Contacto dos', status: RequestStatus.CONTACT_RELEASED },
  { id: '3', title: 'En curso tres', status: RequestStatus.IN_PROGRESS },
  { id: '4', title: 'Terminado cuatro', status: RequestStatus.FINISHED },
  { id: '5', title: 'Cerrado cinco', status: RequestStatus.CLOSED },
  { id: '6', title: 'Sin respuesta seis', status: RequestStatus.NO_RESPONSE },
].map((r) => ({
  createdAt: '2026-09-13T10:00:00.000Z',
  description: 'd',
  clientId: 'c',
  isPublic: false,
  client: { id: 'c', firstName: 'María', lastName: 'González', email: 'm@x.com' },
  ...r,
}));

const applications = [
  { interestId: 'i1', requestId: '10', title: 'Poda de árboles', description: 'd', status: RequestStatus.PUBLISHED, interestStatus: RequestInterestStatus.INTERESTED },
  { interestId: 'i2', requestId: '11', title: 'Cambio de cerradura', description: 'd', status: RequestStatus.CONTACT_RELEASED, interestStatus: RequestInterestStatus.NOT_CHOSEN },
  // already a regular card (chosen) -> must not be duplicated in the applications list
  { interestId: 'i3', requestId: '2', title: 'Contacto dos', description: 'd', status: RequestStatus.CONTACT_RELEASED, interestStatus: RequestInterestStatus.CHOSEN },
];

jest.mock('@/hooks/use-requests', () => {
  const mutation = () => ({ mutate: jest.fn(), isPending: false, error: null });
  return {
    useProfessionalRequests: () => ({ data: requests, isLoading: false }),
    useAvailableRequests: () => ({ data: [], isLoading: false }),
    useMyInterestedRequests: () => ({ data: applications }),
    useAcceptRequest: mutation,
    useRejectRequest: mutation,
    useMarkRequestFinished: mutation,
    useConfirmRequest: mutation,
    useObjectRequest: mutation,
    useRepublishRequest: mutation,
  };
});
jest.mock('@/hooks/use-reviews', () => ({
  useReviewByRequestId: () => ({ data: undefined }),
}));
jest.mock('@/hooks/use-professional-profile', () => ({
  useMyProfessionalProfile: () => ({ data: { status: 'ACTIVE', city: 'Bariloche' }, isLoading: false }),
}));
jest.mock('@/hooks/use-company', () => ({
  useMyCompanyProfile: () => ({ data: undefined, isLoading: false }),
}));
jest.mock('@/lib/auth', () => ({
  getUser: () => ({ id: 'u', hasProfessionalProfile: true }),
  isAuthenticated: () => true,
}));
jest.mock('@/components/layout/app-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
    const text = [...namespace.split('.'), ...key.split('.')].reduce(
      (node: any, part) => node?.[part],
      require('@/messages/es.json'),
    );
    return typeof text === 'string'
      ? text.replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? ''))
      : text;
  },
}));

const statuses = () => screen.getAllByTestId('request-card').map((c) => c.getAttribute('data-status'));

describe('SpecialistDashboardPage', () => {
  it('buckets by whose turn it is', () => {
    render(<SpecialistDashboardPage />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Te toca a vos3',
      'Esperando a la otra parte1',
      'Cerrados1',
    ]);
    expect(statuses()).toEqual([RequestStatus.SENT, RequestStatus.CONTACT_RELEASED, RequestStatus.IN_PROGRESS]);

    fireEvent.click(screen.getByRole('tab', { name: /Esperando/ }));
    expect(statuses()).toEqual([RequestStatus.FINISHED]);

    fireEvent.click(screen.getByRole('tab', { name: /Cerrados/ }));
    expect(statuses()).toEqual([RequestStatus.CLOSED]);
  });

  it('lists bolsa applications with their own status, without duplicating chosen ones', () => {
    render(<SpecialistDashboardPage />);
    expect(screen.getByText('Tus postulaciones en la bolsa')).toBeTruthy();
    const rows = screen.getAllByTestId('application-row');
    expect(rows.map((r) => r.getAttribute('data-interest-status'))).toEqual(['INTERESTED', 'NOT_CHOSEN']);
    expect(screen.getByText('Interesado')).toBeTruthy();
    expect(screen.getByText('No elegido')).toBeTruthy();
  });

  it('collapses the no-agreement requests into the bottom strip', () => {
    render(<SpecialistDashboardPage />);
    expect(screen.getByText('Finalizados sin acuerdo (1)')).toBeTruthy();
    expect(screen.queryByText('Sin respuesta seis')).toBeNull();
  });
});
