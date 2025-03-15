import { Database } from '@/types/supabase';

// Define response types for API endpoints
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

// Define user type (using any for now since we don't have the exact Database type definition)
type User = any;

/**
 * ApiClient - Secure client for interacting with backend API endpoints
 * This replaces direct Supabase access from the frontend
 */
export class ApiClient {
  /**
   * Get the current authenticated user
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to get user' };
      }

      const data = await response.json();
      return { data: data.user, error: null };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { data: null, error: 'Failed to get user' };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to sign in' };
      }

      const data = await response.json();
      return { data: data.user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error: 'Failed to sign in' };
    }
  }

  /**
   * Sign up with email, password, and first name
   */
  static async signUp(email: string, password: string, firstName: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to sign up' };
      }

      const data = await response.json();
      return { data: data.user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error: 'Failed to sign up' };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<ApiResponse<null>> {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to sign out' };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { data: null, error: 'Failed to sign out' };
    }
  }

  /**
   * Get user profile data
   */
  static async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to get profile' };
      }

      const data = await response.json();
      return { data: data.profile, error: null };
    } catch (error) {
      console.error('Error getting profile:', error);
      return { data: null, error: 'Failed to get profile' };
    }
  }

  /**
   * Update user profile data
   */
  static async updateUserProfile(profileData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to update profile' };
      }

      const data = await response.json();
      return { data: data.profile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: 'Failed to update profile' };
    }
  }

  /**
   * Get user credits
   */
  static async getUserCredits(): Promise<ApiResponse<number>> {
    try {
      const response = await fetch('/api/user/credits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to get credits' };
      }

      const data = await response.json();
      return { data: data.credits, error: null };
    } catch (error) {
      console.error('Error getting credits:', error);
      return { data: null, error: 'Failed to get credits' };
    }
  }

  /**
   * Update user credits
   */
  static async updateUserCredits(credits: number): Promise<ApiResponse<number>> {
    try {
      const response = await fetch('/api/user/credits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credits }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to update credits' };
      }

      const data = await response.json();
      return { data: data.credits, error: null };
    } catch (error) {
      console.error('Error updating credits:', error);
      return { data: null, error: 'Failed to update credits' };
    }
  }
} 