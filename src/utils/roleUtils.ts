import { User } from '../types';

/**
 * Check if a user has a specific role
 * Handles both string and array role formats
 */
export const hasRole = (user: User | null, roleToCheck: string): boolean => {
  if (!user?.roles) return false;
  
  const normalizedRole = roleToCheck.toLowerCase();
  
  // If roles is an array
  if (Array.isArray(user.roles)) {
    return user.roles.some(role => role.toLowerCase() === normalizedRole);
  }
  
  // If roles is a string
  if (typeof user.roles === 'string') {
    return user.roles.toLowerCase() === normalizedRole;
  }
  
  return false;
};

/**
 * Check if a user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, rolesToCheck: string[]): boolean => {
  if (!user?.roles) return false;
  
  const normalizedRoles = rolesToCheck.map(r => r.toLowerCase());
  
  if (Array.isArray(user.roles)) {
    return user.roles.some(role => 
      normalizedRoles.includes(role.toLowerCase())
    );
  }
  
  if (typeof user.roles === 'string') {
    return normalizedRoles.includes(user.roles.toLowerCase());
  }
  
  return false;
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasAnyRole(user, ['admin', 'administrator']);
};

/**
 * Check if user is customer
 */
export const isCustomer = (user: User | null): boolean => {
  return hasAnyRole(user, ['user', 'customer']);
};

/**
 * Check if user is manager
 */
export const isManager = (user: User | null): boolean => {
  return hasAnyRole(user, ['manager', 'moderator']);
};

/**
 * Get user's primary role (first role in array or the string itself)
 */
export const getPrimaryRole = (user: User | null): string => {
  if (!user?.roles) return 'guest';
  
  if (Array.isArray(user.roles)) {
    return user.roles.length > 0 ? user.roles[0].toLowerCase() : 'user';
  }
  
  if (typeof user.roles === 'string') {
    return user.roles.toLowerCase();
  }
  
  return 'guest';
};

/**
 * Get all roles as an array (normalized)
 */
export const getRolesArray = (user: User | null): string[] => {
  if (!user?.roles) return [];
  
  if (Array.isArray(user.roles)) {
    return user.roles.map(role => role.toLowerCase());
  }
  
  if (typeof user.roles === 'string') {
    return [user.roles.toLowerCase()];
  }
  
  return [];
};