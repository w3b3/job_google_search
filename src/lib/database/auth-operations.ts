import Database from 'better-sqlite3';
import { getDatabasePath } from './connection';

interface CreateUserFromGoogleParams {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
  accountType: 'free' | 'paid' | 'admin';
  searchesUsedThisMonth: number;
  searchLimit: number;
  billingCycleStart: string;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Get user by Google ID for authentication
 */
export async function getUserByGoogleId(googleId: string): Promise<DatabaseUser | null> {
  const db = new Database(getDatabasePath());
  
  try {
    const stmt = db.prepare(`
      SELECT id, email, name, google_id as googleId, avatar_url as avatarUrl,
             account_type as accountType, searches_used_this_month as searchesUsedThisMonth,
             search_limit as searchLimit, billing_cycle_start as billingCycleStart,
             created_at as createdAt, last_login_at as lastLoginAt
      FROM users 
      WHERE google_id = ?
    `);
    
    const user = stmt.get(googleId) as DatabaseUser | undefined;
    return user || null;
  } finally {
    db.close();
  }
}

/**
 * Create new user from Google OAuth data
 */
export async function createUserFromGoogle(params: CreateUserFromGoogleParams): Promise<DatabaseUser> {
  const db = new Database(getDatabasePath());
  
  try {
    const stmt = db.prepare(`
      INSERT INTO users (email, name, google_id, avatar_url, account_type, searches_used_this_month, search_limit)
      VALUES (?, ?, ?, ?, 'free', 0, 2)
    `);
    
    const result = stmt.run(params.email, params.name, params.googleId, params.avatarUrl);
    
    // Get the created user
    const getUserStmt = db.prepare(`
      SELECT id, email, name, google_id as googleId, avatar_url as avatarUrl,
             account_type as accountType, searches_used_this_month as searchesUsedThisMonth,
             search_limit as searchLimit, billing_cycle_start as billingCycleStart,
             created_at as createdAt, last_login_at as lastLoginAt
      FROM users 
      WHERE id = ?
    `);
    
    const user = getUserStmt.get(result.lastInsertRowid) as DatabaseUser;
    return user;
  } finally {
    db.close();
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  const db = new Database(getDatabasePath());
  
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(userId);
  } finally {
    db.close();
  }
}

/**
 * Get user's current usage statistics and check limits
 */
export async function getUserUsageStats(userId: string): Promise<{
  searchesUsed: number;
  searchLimit: number;
  canCreateSearch: boolean;
  daysUntilReset: number;
  accountType: string;
}> {
  const db = new Database(getDatabasePath());
  
  try {
    // Check if we need to reset monthly usage (if billing cycle has passed)
    const resetStmt = db.prepare(`
      UPDATE users 
      SET searches_used_this_month = 0, 
          billing_cycle_start = date('now', 'start of month')
      WHERE id = ? 
        AND date(billing_cycle_start) < date('now', 'start of month')
    `);
    resetStmt.run(userId);
    
    // Get current usage stats
    const stmt = db.prepare(`
      SELECT searches_used_this_month as searchesUsed,
             search_limit as searchLimit,
             account_type as accountType,
             billing_cycle_start as billingCycleStart
      FROM users 
      WHERE id = ?
    `);
    
    const result = stmt.get(userId) as {
      searchesUsed: number;
      searchLimit: number;
      accountType: string;
      billingCycleStart: string;
    };
    
    if (!result) {
      throw new Error('User not found');
    }
    
    // Check if user can create more searches
    const canCreateSearch = result.searchLimit === -1 || result.searchesUsed < result.searchLimit;
    
    // Calculate days until reset (next month)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      searchesUsed: result.searchesUsed,
      searchLimit: result.searchLimit,
      canCreateSearch,
      daysUntilReset,
      accountType: result.accountType,
    };
  } finally {
    db.close();
  }
}

/**
 * Increment user's search usage count and log the action
 */
export async function incrementUserSearchUsage(userId: string, searchId?: string): Promise<void> {
  const db = new Database(getDatabasePath());
  
  try {
    // Start a transaction
    db.exec('BEGIN TRANSACTION');
    
    // Increment usage counter
    const updateStmt = db.prepare(`
      UPDATE users 
      SET searches_used_this_month = searches_used_this_month + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(userId);
    
    // Log the usage
    const logStmt = db.prepare(`
      INSERT INTO user_usage_logs (user_id, action_type, resource_id, created_at)
      VALUES (?, 'search_executed', ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userId, searchId || null);
    
    // Commit transaction
    db.exec('COMMIT');
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get user by ID (for session management)
 */
export async function getUserById(userId: string): Promise<DatabaseUser | null> {
  const db = new Database(getDatabasePath());
  
  try {
    const stmt = db.prepare(`
      SELECT id, email, name, google_id as googleId, avatar_url as avatarUrl,
             account_type as accountType, searches_used_this_month as searchesUsedThisMonth,
             search_limit as searchLimit, billing_cycle_start as billingCycleStart,
             created_at as createdAt, last_login_at as lastLoginAt
      FROM users 
      WHERE id = ?
    `);
    
    const user = stmt.get(userId) as DatabaseUser | undefined;
    return user || null;
  } finally {
    db.close();
  }
}

/**
 * Manually upgrade user to paid (for scrappy manual management)
 */
export async function upgradeUserToPaid(userId: string): Promise<void> {
  const db = new Database(getDatabasePath());
  
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET account_type = 'paid',
          search_limit = -1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(userId);
    
    if (result.changes === 0) {
      throw new Error('User not found or already upgraded');
    }
    
    // Log the upgrade
    const logStmt = db.prepare(`
      INSERT INTO user_usage_logs (user_id, action_type, metadata, created_at)
      VALUES (?, 'account_upgraded', '{"from": "free", "to": "paid"}', CURRENT_TIMESTAMP)
    `);
    logStmt.run(userId);
  } finally {
    db.close();
  }
}

/**
 * Get user by email (for manual management)
 */
export async function getUserByEmail(email: string): Promise<DatabaseUser | null> {
  const db = new Database(getDatabasePath());
  
  try {
    const stmt = db.prepare(`
      SELECT id, email, name, google_id as googleId, avatar_url as avatarUrl,
             account_type as accountType, searches_used_this_month as searchesUsedThisMonth,
             search_limit as searchLimit, billing_cycle_start as billingCycleStart,
             created_at as createdAt, last_login_at as lastLoginAt
      FROM users 
      WHERE email = ?
    `);
    
    const user = stmt.get(email) as DatabaseUser | undefined;
    return user || null;
  } finally {
    db.close();
  }
}
