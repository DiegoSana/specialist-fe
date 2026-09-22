import { render, screen } from '@testing-library/react';
import ProtectedLayout from '../protected-layout';
import { getUser, isAuthenticated } from '@/lib/auth';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/components/navigation/main-nav', () => ({
  __esModule: true,
  default: () => <nav data-testid="main-nav" />,
}));

jest.mock('@/lib/auth', () => ({
  getUser: jest.fn(),
  isAuthenticated: jest.fn(),
}));

const mockGetUser = getUser as jest.Mock;
const mockIsAuthenticated = isAuthenticated as jest.Mock;

describe('ProtectedLayout', () => {
  beforeEach(() => {
    push.mockClear();
    mockGetUser.mockReset();
    mockIsAuthenticated.mockReset();
  });

  it('redirects to the default login path when not authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false);
    render(<ProtectedLayout>content</ProtectedLayout>);
    await screen.findByTestId('main-nav'); // loading skeleton still mounts the nav
    expect(push).toHaveBeenCalledWith('/es/login');
  });

  it('redirects to a custom noAuthRedirectPath when not authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false);
    render(<ProtectedLayout noAuthRedirectPath="/en/login">content</ProtectedLayout>);
    await screen.findByTestId('main-nav');
    expect(push).toHaveBeenCalledWith('/en/login');
  });

  it('redirects to profile-setup by default when the user has no profile at all', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockReturnValue({ hasClientProfile: false, hasProfessionalProfile: false, hasCompanyProfile: false });
    render(<ProtectedLayout>content</ProtectedLayout>);
    await screen.findByTestId('main-nav');
    expect(push).toHaveBeenCalledWith('/es/profile-setup');
  });

  it('renders children when requireProfile is false, regardless of profile flags', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockReturnValue({ hasClientProfile: false, hasProfessionalProfile: false, hasCompanyProfile: false });
    render(<ProtectedLayout requireProfile={false}>content</ProtectedLayout>);
    expect(await screen.findByText('content')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('redirects a client-only user away when requiredProfileType is "provider"', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockReturnValue({ hasClientProfile: true, hasProfessionalProfile: false, hasCompanyProfile: false });
    render(
      <ProtectedLayout requiredProfileType="provider" noProfileRedirectPath="/es/specialist/setup">
        content
      </ProtectedLayout>
    );
    await screen.findByTestId('main-nav');
    expect(push).toHaveBeenCalledWith('/es/specialist/setup');
  });

  it('renders children for a professional user when requiredProfileType is "provider"', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockReturnValue({ hasClientProfile: false, hasProfessionalProfile: true, hasCompanyProfile: false });
    render(<ProtectedLayout requiredProfileType="provider">content</ProtectedLayout>);
    expect(await screen.findByText('content')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('passes the resolved user to a render-function children', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const user = { id: 'u1', hasClientProfile: true, hasProfessionalProfile: false, hasCompanyProfile: false };
    mockGetUser.mockReturnValue(user);
    render(
      <ProtectedLayout>{(u: any) => <span>hello {u.id}</span>}</ProtectedLayout>
    );
    expect(await screen.findByText('hello u1')).toBeInTheDocument();
  });
});
