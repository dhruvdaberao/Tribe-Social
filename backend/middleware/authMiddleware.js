import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
  let token;

  // Case-insensitive check for 'Bearer'
  if (req.headers.authorization && (req.headers.authorization.startsWith('Bearer') || req.headers.authorization.startsWith('bearer'))) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      // DEBUG: Force hardcoded secret to rule out Env Var corruption
      const getJwtSecret = () => 'tribe_temp_fallback_secret_2024';
      const decoded = jwt.verify(token, getJwtSecret());

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.error("Auth Middleware: User not found for ID:", decoded.id);
        return res.status(401).json({
          message: 'Not authorized, user not found',
          receivedToken: token ? `${token.substring(0, 5)}...` : 'null'
        });
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