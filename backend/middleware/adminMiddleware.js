import superAdmins from '../config/superAdmins.js';

const normalizeUsername = (username = '') => username.toLowerCase();

export const isAdminUser = (user) => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.isAdmin) return true;
  const superAdminSet = superAdmins.map(normalizeUsername);
  if (superAdminSet.includes(normalizeUsername(user.username))) return true;
  return false;
};

export const isSuperAdminUser = (user) => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const superAdminSet = superAdmins.map(normalizeUsername);
  return superAdminSet.includes(normalizeUsername(user.username));
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  req.user.isAdmin = true;
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  if (!isSuperAdminUser(req.user)) {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  req.user.isSuperAdmin = true;
  req.user.isAdmin = true;
  next();
};

export default requireAdmin;
