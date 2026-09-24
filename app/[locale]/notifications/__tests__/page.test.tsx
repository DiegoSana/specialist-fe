import { render, screen } from '@testing-library/react';
import NotificationsPage from '../page';

const mockUseRequireProfile = jest.fn();

jest.mock('@/hooks/use-require-profile', () => ({
  useRequireProfile: () => mockUseRequireProfile(),
}));
jest.mock('@/components/layout/app-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({ data: [], isLoading: false }),
  useMarkNotificationRead: () => ({ mutateAsync: jest.fn() }),
  useMarkAllNotificationsRead: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'es' }),
}));
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

describe('NotificationsPage', () => {
  it('renders nothing while the no-profile gate has not cleared the user', () => {
    mockUseRequireProfile.mockReturnValue({ isChecking: true, canRender: false });
    const { container } = render(<NotificationsPage />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the page once the gate allows it', () => {
    mockUseRequireProfile.mockReturnValue({ isChecking: false, canRender: true });
    render(<NotificationsPage />);
    expect(screen.getByText('notifications.title')).toBeInTheDocument();
  });
});
