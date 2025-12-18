// Mock API client for testing
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: mockApiClient,
}));

export const resetMocks = () => {
  mockApiClient.get.mockReset();
  mockApiClient.post.mockReset();
  mockApiClient.put.mockReset();
  mockApiClient.patch.mockReset();
  mockApiClient.delete.mockReset();
};

