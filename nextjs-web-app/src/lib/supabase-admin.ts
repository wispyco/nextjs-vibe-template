import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * SupabaseAdmin - Secure service for server-side Supabase operations
 * This service uses the service role key and should NEVER be exposed to the client
 */
export class SupabaseAdmin {
  private static instance: ReturnType<typeof createClient> | null = null;

  /**
   * Get a singleton instance of the Supabase admin client
   * This ensures we only create one instance of the client
   */
  static getInstance() {
    if (!this.instance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }

      this.instance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.instance;
  }

  /**
   * Get a user by their ID
   */
  static async getUserById(userId: string) {
    try {
      const supabase = this.getInstance();
      return await supabase.auth.admin.getUserById(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(email: string, password: string, metadata: Record<string, unknown> = {}) {
    try {
      const supabase = this.getInstance();
      return await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: metadata,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string) {
    try {
      const supabase = this.getInstance();
      return await supabase.auth.admin.deleteUser(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Update a user's metadata
   */
  static async updateUserMetadata(userId: string, metadata: Record<string, unknown>) {
    try {
      const supabase = this.getInstance();
      return await supabase.auth.admin.updateUserById(userId, {
        user_metadata: metadata,
      });
    } catch (error) {
      console.error('Error updating user metadata:', error);
      throw error;
    }
  }

  /**
   * Get a user's profile
   */
  static async getUserProfile(userId: string) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      return await (supabase as any).from('profiles').select('*').eq('id', userId).single();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update a user's profile
   */
  static async updateUserProfile(userId: string, profileData: Record<string, unknown>) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      return await (supabase as any).from('profiles').update(profileData).eq('id', userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get a user's credits
   */
  static async getUserCredits(userId: string) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { credits: data?.credits || 0, error: null };
    } catch (error) {
      console.error('Error getting user credits:', error);
      throw error;
    }
  }

  /**
   * Add credits to a user
   */
  static async addUserCredits(userId: string, amount: number, type: string, description?: string) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      return await (supabase as any).rpc('add_user_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_description: description,
      });
    } catch (error) {
      console.error('Error adding user credits:', error);
      throw error;
    }
  }

  /**
   * Deduct credits from a user
   */
  static async deductUserCredits(userId: string, amount: number, type: string, description?: string) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      return await (supabase as any).rpc('deduct_user_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_description: description,
      });
    } catch (error) {
      console.error('Error deducting user credits:', error);
      throw error;
    }
  }

  /**
   * Deduct a generation credit
   */
  static async deductGenerationCredit(userId: string, requestId?: string, styleIndex?: string) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      return await (supabase as any).rpc('deduct_generation_credit', {
        p_user_id: userId,
        p_request_id: requestId || null,
        p_style_index: styleIndex || null,
      });
    } catch (error) {
      console.error('Error deducting generation credit:', error);
      throw error;
    }
  }

  /**
   * Create a credit purchase record
   */
  static async createCreditPurchase(purchaseData: {
    user_id: string;
    amount: number;
    cost: number;
    currency: string;
    stripe_session_id: string;
    stripe_payment_intent_id?: string;
  }) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      return await (supabase as any).from('credit_purchases').insert(purchaseData);
    } catch (error) {
      console.error('Error creating credit purchase:', error);
      throw error;
    }
  }

  /**
   * Create a subscription history record
   */
  static async createSubscriptionHistory(historyData: {
    user_id: string;
    subscription_tier: string;
    status: string;
    amount_paid?: number;
    currency?: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    description?: string;
  }) {
    try {
      const supabase = this.getInstance();
      // Using type assertion since we don't have the exact Database type
      return await (supabase as any).from('subscription_history').insert(historyData);
    } catch (error) {
      console.error('Error creating subscription history:', error);
      throw error;
    }
  }
} 