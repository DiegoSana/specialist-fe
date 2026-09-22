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

const availableRequests = [
  // requestId '10' matches an existing application above -> must be excluded from "Trabajos
  // disponibles" (it already shows up in "Tus postulaciones en la bolsa"). Placed first so a
  // filtering bug (rather than the 4-item cap) would still surface it.
  { id: '10', title: 'Ya tengo interés', description: 'desc-interested' },
  { id: '20', title: 'Reparar techo', description: 'desc 20' },
  { id: '21', title: 'Pintura de fachada', description: 'desc 21' },
  { id: '22', title: 'Instalación eléctrica', description: 'desc 22' },
  { id: '23', title: 'Poda de árboles en el fondo', description: 'desc 23' },
  // 5th request left after filtering -> hidden by the 4-item cap.
  { id: '24', title: 'Destape de cañería general', description: 'desc 24' },
].map((r) => ({
  createdAt: '2026-09-13T10:00:00.000Z',
  clientId: 'c',
  client: { id: 'c', firstName: 'Ana', lastName: 'Ruiz', email: 'a@x.com' },
  ...r,
}));

jest.mock('@/hooks/use-requests', () => {
  const mutation = () => ({ mutate: jest.fn(), isPending: false, error: null });
  return {
    useProfessionalRequests: () => ({ data: requests, isLoading: false }),
    useAvailableRequests: () => ({ data: availableRequests, isLoading: false }),
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
jest.mock('@/components/layout/protected-layout', () => ({
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

  it('shows available jobs by title (not description), excludes ones already applied to, caps the list, and links to the job board', () => {
    render(<SpecialistDashboardPage />);

    // Title shown, not description.
    expect(screen.getByText('Reparar techo')).toBeTruthy();
    expect(screen.queryByText('desc 20')).toBeNull();

    // Already-interested request excluded entirely, not just pushed past the cap.
    expect(screen.queryByText('Ya tengo interés')).toBeNull();

    // Capped at 4 of the 5 remaining after filtering.
    expect(screen.getByText('Pintura de fachada')).toBeTruthy();
    expect(screen.getByText('Instalación eléctrica')).toBeTruthy();
    expect(screen.getByText('Poda de árboles en el fondo')).toBeTruthy();
    expect(screen.queryByText('Destape de cañería general')).toBeNull();

    // Link to the full job board.
    const link = screen.getByText('Ver todas en la bolsa de trabajo').closest('a');
    expect(link).toHaveAttribute('href', '/es/specialist/job-board');
  });
});
