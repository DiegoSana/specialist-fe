import { renderHook, waitFor } from '@testing-library/react';
import { useRequireProfile } from '../use-require-profile';
import { getUser, isAuthenticated } from '@/lib/auth';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/lib/auth', () => ({
  getUser: jest.fn(),
  isAuthenticated: jest.fn(),
}));

const mockGetUser = getUser as jest.Mock;
const mockIsAuthenticated = isAuthenticated as jest.Mock;

describe('useRequireProfile', () => {
  beforeEach(() => {
    push.mockClear();
    mockGetUser.mockReset();
    mockIsAuthenticated.mockReset();
  });

  it('redirects to /es/login when not authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const { result } = renderHook(() => useRequireProfile());

    await waitFor(() => expect(push).toHaveBeenCalledWith('/es/login'));
    expect(result.current.canRender).toBe(false);
  });

  it('redirects to /es/profile-setup when authenticated with no profile at all', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockReturnValue({
      hasClientProfile: false,
      hasProfessionalProfile: false,
      hasCompanyProfile: false,
    });
    const { result } = renderHook(() => useRequireProfile());

    await waitFor(() => expect(push).toHaveBeenCalledWith('/es/profile-setup'));
    expect(result.current.canRender).toBe(false);
  });

  it('allows rendering for an authenticated user with a client profile', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockReturnValue({
      hasClientProfile: true,
      hasProfessionalProfile: false,
      hasCompanyProfile: false,
    });
    const { result } = renderHook(() => useRequireProfile());

    await waitFor(() => expect(result.current.canRender).toBe(true));
    expect(push).not.toHaveBeenCalled();
  });

  it('allows rendering for an authenticated user with only a company profile', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUser.mockReturnValue({
      hasClientProfile: false,
      hasProfessionalProfile: false,
      hasCompanyProfile: true,
    });
    const { result } = renderHook(() => useRequireProfile());

    await waitFor(() => expect(result.current.canRender).toBe(true));
    expect(push).not.toHaveBeenCalled();
  });
});
