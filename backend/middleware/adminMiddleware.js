import adminUsers from '../config/adminUsers.js';

const normalizeUsername = (username = '') => username.toLowerCase();

export const isAdminUser = (user) => {
  if (!user) return false;
  if (user.isAdmin) return true;
  const adminSet = adminUsers.map(normalizeUsername);
  return adminSet.includes(normalizeUsername(user.username));
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

export default requireAdmin;
