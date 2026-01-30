import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

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