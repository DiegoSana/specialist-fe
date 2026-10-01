import { fireEvent, render, screen } from '@testing-library/react';
import RequestListCard from '../request-list-card';
import FinalRequestsStrip from '../final-requests-strip';
import { Request, RequestStatus } from '@/types';

const mutate = jest.fn();
jest.mock('@/hooks/use-requests', () => {
  const mutation = () => ({ mutate, isPending: false, error: null });
  return {
    useAcceptRequest: mutation,
    useRejectRequest: mutation,
    useMarkRequestFinished: mutation,
    useConfirmRequest: mutation,
    useObjectRequest: mutation,
    useRepublishRequest: mutation,
  };
});

const useReviewByRequestId = jest.fn(() => ({ data: undefined }));
jest.mock('@/hooks/use-reviews', () => ({
  useReviewByRequestId: (...args: unknown[]) => useReviewByRequestId(...args),
}));

// Real Spanish copy with simple {var} interpolation (ICU plurals are out of scope for the mock).
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

const make = (overrides: Partial<Request> = {}): Request =>
  ({
    id: 'r1',
    clientId: 'c1',
    isPublic: false,
    title: 'Pintura de deck',
    description: 'Pintar 20m2',
    status: RequestStatus.SENT,
    createdAt: '2026-09-13T10:00:00.000Z',
    updatedAt: '2026-09-13T10:00:00.000Z',
    client: { id: 'c1', firstName: 'María', lastName: 'González', email: 'm@x.com' },
    ...overrides,
  }) as Request;

describe('RequestListCard', () => {
  beforeEach(() => {
    mutate.mockClear();
    useReviewByRequestId.mockReturnValue({ data: undefined });
  });

  it('specialist: SENT shows Aceptar/Rechazar and it is their turn', () => {
    render(<RequestListCard request={make()} role="provider" locale="es" />);
    expect(screen.getByText('Enviado')).toBeTruthy();
    expect(screen.getByText('Te toca a vos — respondé')).toBeTruthy();
    fireEvent.click(screen.getByText('Aceptar'));
    expect(mutate).toHaveBeenCalledWith({ id: 'r1' });
    expect(screen.getByText('Rechazar')).toBeTruthy();
  });

  it('specialist: IN_PROGRESS shows a single "Marcar como terminado" action', () => {
    render(<RequestListCard request={make({ status: RequestStatus.IN_PROGRESS })} role="provider" locale="es" />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByText('Marcar como terminado')).toBeTruthy();
  });

  it('specialist: FINISHED is waiting on the client and has no action', () => {
    render(<RequestListCard request={make({ status: RequestStatus.FINISHED })} role="provider" locale="es" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/Esperando a la otra parte/)).toBeTruthy();
  });

  it('client: PUBLISHED with interested specialists offers "Ver interesados y elegir"', () => {
    render(
      <RequestListCard
        request={make({ status: RequestStatus.PUBLISHED, isPublic: true, interestsCount: 3 })}
        role="client"
        locale="es"
      />,
    );
    expect(screen.getByText('Ver interesados y elegir')).toBeTruthy();
    expect(screen.getByText('Te toca a vos — elegí uno')).toBeTruthy();
  });

  it('client: PUBLISHED without interested specialists has no action', () => {
    render(
      <RequestListCard
        request={make({ status: RequestStatus.PUBLISHED, isPublic: true, interestsCount: 0 })}
        role="client"
        locale="es"
      />,
    );
    expect(screen.queryByText('Ver interesados y elegir')).toBeNull();
  });

  it('client: FINISHED shows Confirmar / Objetar, and objecting opens the reason dialog', () => {
    render(<RequestListCard request={make({ status: RequestStatus.FINISHED })} role="client" locale="es" />);
    fireEvent.click(screen.getByText('Confirmar'));
    expect(mutate).toHaveBeenCalledWith({ id: 'r1' });
    fireEvent.click(screen.getByText('Objetar'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Objetar el trabajo')).toBeTruthy();
  });

  it('client: CONTACT_RELEASED opens WhatsApp with the specialist phone', () => {
    render(
      <RequestListCard
        request={make({
          status: RequestStatus.CONTACT_RELEASED,
          professional: {
            id: 'p1',
            user: {
              id: 'u',
              firstName: 'Jorge',
              lastName: 'Fernández',
              email: 'j@x.com',
              phone: '+54 9 294 412-3456',
            },
          } as any,
        })}
        role="client"
        locale="es"
      />,
    );
    const link = screen.getByText('Abrir WhatsApp').closest('a');
    expect(link?.getAttribute('href')).toBe('https://wa.me/5492944123456');
    expect(screen.getByText('Con Jorge Fernández')).toBeTruthy();
  });

  it('never renders prices', () => {
    render(
      <RequestListCard
        request={make({ status: RequestStatus.IN_PROGRESS, quoteAmount: 5000 })}
        role="client"
        locale="es"
      />,
    );
    expect(screen.queryByText(/5000|\$/)).toBeNull();
  });

  it('client: CLOSED without an existing review offers "Calificar"', () => {
    useReviewByRequestId.mockReturnValue({ data: undefined });
    render(<RequestListCard request={make({ status: RequestStatus.CLOSED })} role="client" locale="es" />);
    expect(screen.getByText('Calificar')).toBeTruthy();
  });

  it('client: CLOSED with an existing review does not offer "Calificar" again', () => {
    useReviewByRequestId.mockReturnValue({ data: { rating: 5, comment: 'Buenísimo' } });
    render(<RequestListCard request={make({ status: RequestStatus.CLOSED })} role="client" locale="es" />);
    expect(screen.queryByText('Calificar')).toBeNull();
  });

  it('specialist: CLOSED without an existing PROVIDER_TO_CLIENT review offers "Calificar"', () => {
    useReviewByRequestId.mockReturnValue({ data: undefined });
    render(
      <RequestListCard request={make({ status: RequestStatus.CLOSED })} role="provider" locale="es" />,
    );
    expect(screen.getByText('Calificar')).toBeTruthy();
  });

  it('specialist: CLOSED with an existing PROVIDER_TO_CLIENT review does not offer "Calificar" again', () => {
    useReviewByRequestId.mockReturnValue({ data: { rating: 5, comment: 'Buen cliente' } });
    render(
      <RequestListCard request={make({ status: RequestStatus.CLOSED })} role="provider" locale="es" />,
    );
    expect(screen.queryByText('Calificar')).toBeNull();
  });

  // Regression: the CLOSED hint used to be a static "Cerrado — dejá tu calificación" regardless
  // of whether the viewer had already rated — see root cause in lib/request-status.ts
  // getClosedReviewState().
  describe('CLOSED hint reflects review state (not a static "dejá tu calificación")', () => {
    it('client: no myReview yet — shows the rate-CTA hint', () => {
      render(
        <RequestListCard
          request={make({ status: RequestStatus.CLOSED, myReview: null, counterpartReview: null })}
          role="client"
          locale="es"
        />,
      );
      expect(screen.getByTestId('status-hint').textContent).toBe('Cerrado — dejá tu calificación');
    });

    it('client: already rated, counterpart review still pending — shows "esperando" hint, not the rate CTA', () => {
      render(
        <RequestListCard
          request={make({
            status: RequestStatus.CLOSED,
            myReview: { id: 'rev-1', rating: 5, comment: null, status: 'APPROVED', revealedAt: null, createdAt: '2026-09-01T00:00:00.000Z' },
            counterpartReview: { pending: true },
          })}
          role="client"
          locale="es"
        />,
      );
      expect(screen.getByTestId('status-hint').textContent).toBe(
        'Ya calificaste — esperando la calificación del especialista',
      );
      expect(screen.queryByText('Cerrado — dejá tu calificación')).toBeNull();
    });

    it('client: both rated and revealed — shows the received rating as stars instead of a CTA', () => {
      render(
        <RequestListCard
          request={make({
            status: RequestStatus.CLOSED,
            myReview: { id: 'rev-1', rating: 5, comment: null, status: 'APPROVED', revealedAt: '2026-09-02T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
            counterpartReview: { id: 'rev-2', rating: 4, comment: 'Buen trabajo', status: 'APPROVED', revealedAt: '2026-09-02T00:00:00.000Z', createdAt: '2026-09-01T12:00:00.000Z' },
          })}
          role="client"
          locale="es"
        />,
      );
      const rating = screen.getByTestId('closed-received-rating');
      expect(rating.textContent).toBe('Te calificó con ★★★★☆');
      expect(screen.queryByText('Cerrado — dejá tu calificación')).toBeNull();
    });

    it('provider: both rated and revealed uses the provider-facing wording', () => {
      render(
        <RequestListCard
          request={make({
            status: RequestStatus.CLOSED,
            myReview: { id: 'rev-1', rating: 3, comment: null, status: 'APPROVED', revealedAt: '2026-09-02T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
            counterpartReview: { id: 'rev-2', rating: 2, comment: null, status: 'APPROVED', revealedAt: '2026-09-02T00:00:00.000Z', createdAt: '2026-09-01T12:00:00.000Z' },
          })}
          role="provider"
          locale="es"
        />,
      );
      expect(screen.getByTestId('closed-received-rating').textContent).toBe('Te calificó con ★★☆☆☆');
    });
  });
});

describe('FinalRequestsStrip', () => {
  const finals = [
    make({ id: 'a', status: RequestStatus.REJECTED, title: 'Uno', statusReason: 'No tengo tiempo', isPublic: true, tradeId: 't1' }),
    make({ id: 'b', status: RequestStatus.CANCELLED, title: 'Dos' }),
  ];

  it('is collapsed by default and shows the reason + republish when expanded', () => {
    render(<FinalRequestsStrip requests={finals} role="client" locale="es" />);
    expect(screen.getByText('Finalizados sin acuerdo (2)')).toBeTruthy();
    expect(screen.queryByTestId('final-request')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Finalizados sin acuerdo/ }));
    expect(screen.getAllByTestId('final-request')).toHaveLength(2);
    expect(screen.getByText('Motivo: No tengo tiempo')).toBeTruthy();
    // only the REJECTED one can be republished
    expect(screen.getAllByText('Volver a publicar')).toHaveLength(1);
  });

  it('renders nothing when there are no final requests', () => {
    const { container } = render(<FinalRequestsStrip requests={[]} role="client" locale="es" />);
    expect(container.firstChild).toBeNull();
  });
});
