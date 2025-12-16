// Authentication utilities

export const AUTH_TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token in localStorage:', error);
      throw error;
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing auth data from localStorage:', error);
    }
  }
}

export function removeUser(): void {
  // Alias for removeAuthToken for backward compatibility
  removeAuthToken();
}

export function setUser(user: any): void {
  if (typeof window !== 'undefined') {
    try {
      const userToStore = { ...user };
      const serialized = JSON.stringify(userToStore);
      localStorage.setItem(USER_KEY, serialized);
      
      // Dispatch custom event to notify components of user update
      const event = new CustomEvent('userUpdated', { detail: userToStore });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error storing user in localStorage:', error);
      throw error;
    }
  }
}

export function getUser(): any | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

