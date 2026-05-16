/**
 * Role-based permissions (View / Create / Edit / Delete) for shuttle module resources.
 * Backend may send `user.permissions` — when present, those override this matrix.
 */

export const RESOURCES = {
  SHUTTLE: 'shuttle',
  TRIPS: 'trips',
  BOOKINGS: 'bookings',
  REQUESTS: 'requests',
  USERS: 'users',
  DESTINATIONS: 'destinations',
  LOGS: 'logs',
  REPORTS: 'reports',
  ADMIN_LIVE: 'admin_live',
};

const ALL = { view: true, create: true, edit: true, delete: true };
const READ = { view: true, create: false, edit: false, delete: false };
const READ_WRITE = { view: true, create: true, edit: true, delete: false };

const matrix = {
  super_admin: {
    [RESOURCES.SHUTTLE]: ALL,
    [RESOURCES.TRIPS]: ALL,
    [RESOURCES.BOOKINGS]: ALL,
    [RESOURCES.REQUESTS]: ALL,
    [RESOURCES.USERS]: ALL,
    [RESOURCES.DESTINATIONS]: ALL,
    [RESOURCES.LOGS]: ALL,
    [RESOURCES.REPORTS]: ALL,
    [RESOURCES.ADMIN_LIVE]: ALL,
  },
  admin: {
    [RESOURCES.SHUTTLE]: ALL,
    [RESOURCES.TRIPS]: ALL,
    [RESOURCES.BOOKINGS]: READ_WRITE,
    [RESOURCES.REQUESTS]: ALL,
    [RESOURCES.USERS]: READ_WRITE,
    [RESOURCES.DESTINATIONS]: ALL,
    [RESOURCES.LOGS]: ALL,
    [RESOURCES.REPORTS]: READ_WRITE,
    [RESOURCES.ADMIN_LIVE]: ALL,
  },
  staff: {
    [RESOURCES.SHUTTLE]: READ,
    [RESOURCES.TRIPS]: READ_WRITE,
    [RESOURCES.BOOKINGS]: READ,
    [RESOURCES.REQUESTS]: READ_WRITE,
    [RESOURCES.USERS]: READ,
    [RESOURCES.DESTINATIONS]: READ_WRITE,
    [RESOURCES.LOGS]: READ,
    [RESOURCES.REPORTS]: READ,
    [RESOURCES.ADMIN_LIVE]: READ,
  },
  driver: {
    [RESOURCES.SHUTTLE]: { view: true, create: false, edit: true, delete: false },
    [RESOURCES.TRIPS]: { view: true, create: false, edit: true, delete: false },
    [RESOURCES.BOOKINGS]: READ,
    [RESOURCES.REQUESTS]: READ,
    [RESOURCES.USERS]: READ,
    [RESOURCES.DESTINATIONS]: READ,
    [RESOURCES.LOGS]: READ_WRITE,
    [RESOURCES.REPORTS]: READ,
    [RESOURCES.ADMIN_LIVE]: READ,
  },
  tenant: {
    [RESOURCES.SHUTTLE]: { view: true, create: false, edit: false, delete: false },
    [RESOURCES.TRIPS]: { view: true, create: false, edit: false, delete: false },
    [RESOURCES.BOOKINGS]: { view: true, create: true, edit: true, delete: true },
    [RESOURCES.REQUESTS]: { view: true, create: true, edit: false, delete: false },
    [RESOURCES.USERS]: READ,
    [RESOURCES.DESTINATIONS]: READ,
    [RESOURCES.LOGS]: READ,
    [RESOURCES.REPORTS]: READ,
    [RESOURCES.ADMIN_LIVE]: READ,
  },
};

export const normalizeRoleKey = (role) => {
  const r = String(role || '').toLowerCase();
  if (r === 'super_admin' || r === 'superadmin') return 'super_admin';
  if (r === 'resident') return 'tenant';
  return r || 'tenant';
};

/**
 * @param {'view'|'create'|'edit'|'delete'} action
 */
export const can = (user, resource, action) => {
  if (!user) return false;
  const custom = user.permissions?.[resource];
  if (custom && typeof custom[action] === 'boolean') return custom[action];

  const role = normalizeRoleKey(user.role);
  const row = matrix[role] || matrix.tenant;
  const cell = row[resource] || READ;
  return !!cell[action];
};

export const isAdminNavigatorRole = (role) => {
  const r = normalizeRoleKey(role);
  return r === 'super_admin' || r === 'admin' || r === 'staff';
};
