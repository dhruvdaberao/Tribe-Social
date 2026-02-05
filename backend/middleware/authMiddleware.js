import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import adminUsers from '../config/adminUsers.js';
import superAdmins from '../config/superAdmins.js';

const DISABLED_MESSAGE = 'Your account has been disabled by the Admin.';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 🔐 SECURITY: Verify using the environment secret.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.warn(`⚠️ Auth Failed: User not found for ID ${decoded.id}`);
        return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
      }

      if (req.user.isDisabled || req.user.isHidden) {
        return res.status(403).json({ message: DISABLED_MESSAGE });
      }

      const adminSet = adminUsers.map((username) => username.toLowerCase());
      const superAdminSet = superAdmins.map((username) => username.toLowerCase());
      const isSuperAdmin = req.user?.username && superAdminSet.includes(req.user.username.toLowerCase());
      const isAdmin = req.user?.username && adminSet.includes(req.user.username.toLowerCase());

      if (isSuperAdmin && !req.user.isSuperAdmin) {
        req.user.isSuperAdmin = true;
        req.user.isAdmin = true;
        await User.updateOne({ _id: req.user._id }, { $set: { isSuperAdmin: true, isAdmin: true } });
      } else if (isAdmin && !req.user.isAdmin) {
        req.user.isAdmin = true;
        await User.updateOne({ _id: req.user._id }, { $set: { isAdmin: true } });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({
        message: 'Not authorized, token failed',
        error: error.message,
        receivedHeader: req.headers.authorization // Echo back the header to debug stripping
      });
    }
  }

  if (!token) {
    res.status(401).json({
      message: 'Not authorized, no token',
      receivedHeader: req.headers.authorization || 'MISSING' // Echo back emptiness
    });
  }
};

export default protect;
