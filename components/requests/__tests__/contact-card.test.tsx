import { render, screen } from '@testing-library/react';
import ContactCard from '../contact-card';
import { Counterpart } from '@/lib/request-participants';

// jest.setup.js mocks next-intl as key => key; here we want the real Spanish copy.
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) =>
    [...namespace.split('.'), ...key.split('.')].reduce(
      (node: any, part) => node?.[part],
      require('@/messages/es.json'),
    ),
}));

const counterpart = (overrides: Partial<Counterpart> = {}): Counterpart => ({
  name: 'Juan Pérez',
  phone: '+5492944123456',
  initials: 'JP',
  ...overrides,
});

describe('ContactCard', () => {
  it('renders nothing when no counterpart is known yet (e.g. bolsa request, nobody chosen)', () => {
    const { container } = render(<ContactCard counterpart={counterpart({ name: null })} released={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the counterpart name once known, even before contact is released (SENT)', () => {
    render(<ContactCard counterpart={counterpart()} released={false} />);
    expect(screen.getByText('Juan Pérez')).toBeTruthy();
  });

  it('hides the phone/WhatsApp button before contact is released', () => {
    render(<ContactCard counterpart={counterpart()} released={false} />);
    expect(screen.queryByText('+5492944123456')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Todavía no tenemos un teléfono para mostrarte. Coordiná por los datos del perfil.')).toBeTruthy();
  });

  it('shows the phone and an Abrir WhatsApp link once contact is released', () => {
    render(<ContactCard counterpart={counterpart()} released={true} />);
    expect(screen.getByText('+5492944123456')).toBeTruthy();
    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link.href).toContain('wa.me/5492944123456');
  });

  it('shows the no-phone message when released but the counterpart has no phone', () => {
    render(<ContactCard counterpart={counterpart({ phone: null })} released={true} />);
    expect(screen.getByText('Todavía no tenemos un teléfono para mostrarte. Coordiná por los datos del perfil.')).toBeTruthy();
  });
});
