import { fireEvent, render, screen } from '@testing-library/react';
import ClientDashboardPage from '../page';
import { RequestStatus } from '@/types';

const requests = [
  { id: '1', title: 'Borrador uno', status: RequestStatus.DRAFT },
  { id: '2', title: 'Publicado con interesados', status: RequestStatus.PUBLISHED, isPublic: true, interestsCount: 2 },
  { id: '3', title: 'Enviado dos', status: RequestStatus.SENT },
  { id: '4', title: 'Terminado tres', status: RequestStatus.FINISHED },
  { id: '5', title: 'Cerrado cuatro', status: RequestStatus.CLOSED },
  { id: '6', title: 'Rechazado cinco', status: RequestStatus.REJECTED },
].map((r) => ({ createdAt: '2026-09-13T10:00:00.000Z', description: 'd', clientId: 'c', isPublic: false, ...r }));

jest.mock('@/hooks/use-requests', () => {
  const mutation = () => ({ mutate: jest.fn(), isPending: false, error: null });
  return {
    useClientRequests: () => ({ data: requests, isLoading: false }),
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

describe('ClientDashboardPage tabs', () => {
  it('shows the counters and filters the cards by whose turn it is', () => {
    render(<ClientDashboardPage />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Te toca a vos3',
      'Esperando a la otra parte1',
      'Cerrados1',
    ]);

    // "Te toca a vos": draft, published-with-interests and finished
    expect(screen.getAllByTestId('request-card').map((c) => c.getAttribute('data-status'))).toEqual([
      RequestStatus.DRAFT,
      RequestStatus.PUBLISHED,
      RequestStatus.FINISHED,
    ]);

    fireEvent.click(screen.getByRole('tab', { name: /Esperando a la otra parte/ }));
    expect(screen.getAllByTestId('request-card').map((c) => c.getAttribute('data-status'))).toEqual([
      RequestStatus.SENT,
    ]);

    fireEvent.click(screen.getByRole('tab', { name: /Cerrados/ }));
    expect(screen.getAllByTestId('request-card').map((c) => c.getAttribute('data-status'))).toEqual([
      RequestStatus.CLOSED,
    ]);
  });

  it('keeps final no-agreement requests out of the tabs, in the collapsed strip', () => {
    render(<ClientDashboardPage />);
    expect(screen.queryByText('Rechazado cinco')).toBeNull();
    expect(screen.getByText('Finalizados sin acuerdo (1)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Finalizados sin acuerdo/ }));
    expect(screen.getByText('Rechazado cinco')).toBeTruthy();
  });
});
