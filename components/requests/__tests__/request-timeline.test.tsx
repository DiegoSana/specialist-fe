import { render, screen } from '@testing-library/react';
import RequestTimeline from '../request-timeline';
import { RequestStatus } from '@/types';

// jest.setup.js mocks next-intl as key => key; here we want the real Spanish copy.
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) =>
    [...namespace.split('.'), ...key.split('.')].reduce(
      (node: any, part) => node?.[part],
      require('@/messages/es.json'),
    ),
}));

const renderTimeline = (props: Partial<React.ComponentProps<typeof RequestTimeline>> = {}) =>
  render(
    <RequestTimeline
      status={RequestStatus.IN_PROGRESS}
      createdAt="2026-09-13T10:00:00.000Z"
      updatedAt="2026-09-14T10:00:00.000Z"
      {...props}
    />,
  );

describe('RequestTimeline', () => {
  it('shows the four post-contact steps', () => {
    renderTimeline();
    for (const label of ['Contacto liberado', 'En curso', 'Terminado', 'Cerrado']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('is at 50% while in progress', () => {
    renderTimeline({ status: RequestStatus.IN_PROGRESS });
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText('El especialista está trabajando en tu solicitud')).toBeTruthy();
  });

  it('is at 100% once closed', () => {
    renderTimeline({ status: RequestStatus.CLOSED });
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('shows no progress before contact is released', () => {
    renderTimeline({ status: RequestStatus.SENT });
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('Esperando respuesta del especialista')).toBeTruthy();
  });

  it('uses the "choose one" copy for a published request with interests', () => {
    renderTimeline({ status: RequestStatus.PUBLISHED, hasInterestedProfessionals: true });
    expect(screen.getByText(/Elegí un especialista/)).toBeTruthy();
  });

  it('keeps the request on the "Terminado" step while under review', () => {
    renderTimeline({ status: RequestStatus.UNDER_REVIEW });
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('Soporte está revisando el pedido')).toBeTruthy();
  });

  it.each([
    [RequestStatus.EXPIRED, 'Vencido'],
    [RequestStatus.REJECTED, 'Rechazado'],
    [RequestStatus.CANCELLED, 'Cancelado'],
    [RequestStatus.ABANDONED, 'Abandonado'],
  ])('replaces the steps with a summary for %s', (status, label) => {
    renderTimeline({ status });
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.queryByText('Contacto liberado')).toBeNull();
  });

  it('shows the stored reason on a not-completed request', () => {
    renderTimeline({ status: RequestStatus.NOT_COMPLETED, statusReason: 'No hubo acuerdo de alcance' });
    expect(screen.getByText(/No hubo acuerdo de alcance/)).toBeTruthy();
  });
});
