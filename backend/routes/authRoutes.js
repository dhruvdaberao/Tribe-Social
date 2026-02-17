// import express from 'express';
// import jwt from 'jsonwebtoken';
// import User from '../models/userModel.js';

// const router = express.Router();

// // Generate JWT
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: '30d',
//   });
// };

// // @route   POST /api/auth/register
// router.post('/register', async (req, res) => {
//   const { name, username, email, password } = req.body;

//   try {
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: 'An account with this email already exists.' });
//     }

//     const usernameExists = await User.findOne({ username });
//     if (usernameExists) {
//         return res.status(400).json({ message: 'This username is already taken.' });
//     }

//     const user = await User.create({ name, username, email, password });

//     if (user) {
//       res.status(201).json({
//         token: generateToken(user._id),
//         user: user,
//       });
//     } else {
//       res.status(400).json({ message: 'Invalid user data' });
//     }
//   } catch (error) {
//     console.error("Registration Error:", error);
//     res.status(500).json({ message: 'Server error during registration.' });
//   }
// });

// // @route   POST /api/auth/login
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (user && (await user.matchPassword(password))) {
//       res.json({
//         token: generateToken(user._id),
//         user: user,
//       });
//     } else {
//       res.status(401).json({ message: 'Invalid email or password' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// export default router;







import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';
import User from '../models/userModel.js';
import superAdmins from '../config/superAdmins.js';
import { sendEmail, renderTemplate } from '../services/emailService.js';
import { isEmailEnabledFor } from '../utils/notificationPrefs.js';

const DISABLED_MESSAGE = 'Your account has been disabled by the Admin';

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
};
import OTP from '../models/otpModel.js';
import Follow from '../models/followModel.js';

const router = express.Router();

// Initialize Resend with API Key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

const normalizeUsername = (value = '') => value.trim().toLowerCase();
const isValidUsername = (value = '') => /^[a-z0-9]+(?:\.[a-z0-9]+)*$/.test(value);

// 🔐 SECURITY: Use ONLY the Environment Variable. No fallbacks.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    const normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(normalizedUsername)) {
      return res.status(400).json({
        message: 'Username must be lowercase and can only include letters, numbers, and single dots.',
      });
    }
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'An account with this email already exists.' });
    const usernameExists = await User.findOne({ username: normalizedUsername });
    if (usernameExists) return res.status(400).json({ message: 'This username is already taken.' });
    const superAdminSet = superAdmins.map((admin) => admin.toLowerCase());
    const isSuperAdmin = superAdminSet.includes(normalizedUsername);
    const isAdmin = isSuperAdmin;
    const user = await User.create({ name, username: normalizedUsername, email, password, isAdmin, isSuperAdmin });

    // Auto-follow 'Tribe' official account
    if (user) {
      try {
        const tribeAccount = await User.findOne({ username: { $regex: /^tribe$/i } });
        if (tribeAccount && tribeAccount._id.toString() !== user._id.toString()) {
          await Follow.create({ follower: user._id, following: tribeAccount._id });
          await User.findByIdAndUpdate(tribeAccount._id, { $inc: { followersCount: 1 } });
          await User.findByIdAndUpdate(user._id, { $inc: { followingCount: 1 } });
          user.followingCount = 1; // Update in-memory object
        }
      } catch (followError) {
        console.error("Auto-follow error:", followError);
      }
    }

    if (user) {
      res.status(201).json({ token: generateToken(user._id), user: user });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user?.isDisabled || user?.isHidden) {
      return res.status(403).json({ message: DISABLED_MESSAGE });
    }
    if (user && (await user.matchPassword(password))) {
      const superAdminSet = superAdmins.map((admin) => admin.toLowerCase());
      const isSuperAdmin = superAdminSet.includes(user.username.toLowerCase());
      const isAdmin = isSuperAdmin || user.isAdmin;
      if ((isAdmin && !user.isAdmin) || (isSuperAdmin && !user.isSuperAdmin)) {
        user.isAdmin = isAdmin;
        user.isSuperAdmin = isSuperAdmin;
      }

      const userAgent = req.headers['user-agent'] || 'Unknown device';
      const ipAddress = getClientIp(req);
      const deviceId = req.body?.deviceId || '';
      const deviceHash = crypto
        .createHash('sha256')
        .update(`${userAgent}|${deviceId}`)
        .digest('hex');

      const lastDeviceHash = user.lastLoginMeta?.lastDeviceHash;
      const isNewDevice = Boolean(lastDeviceHash && lastDeviceHash !== deviceHash);

      user.lastLoginMeta = {
        lastIp: ipAddress,
        lastUserAgent: userAgent,
        lastLoginAt: new Date(),
        lastDeviceHash: deviceHash,
      };

      await user.save();

      if (isNewDevice && isEmailEnabledFor(user, 'newDevice')) {
        try {
          const html = await renderTemplate('newDeviceLogin.html', {
            userName: user.name || 'there',
            time: new Date().toLocaleString(),
            ip: ipAddress || 'Unknown',
            userAgent,
            resetUrl: `${process.env.FRONTEND_URL || 'https://tribe-social.vercel.app'}/forgot-password`,
          });
          await sendEmail({
            to: user.email,
            subject: 'New device login to your Tribe Social account',
            html,
            text: `New login detected at ${new Date().toLocaleString()} from ${userAgent} (${ipAddress}). If this wasn't you, reset your password.`,
          });
        } catch (emailError) {
          console.error('Failed to send new device email:', emailError);
        }
      }

      res.json({ token: generateToken(user._id), user: user });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email.' });
    if (user.isDisabled || user.isHidden) return res.status(403).json({ message: DISABLED_MESSAGE });

    // Generate 6-digit OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpValue, 10);

    // Save to DB (expires in 5 mins)
    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Send Email via Resend API (Uses Port 443 - Not blocked by Render)
    if (process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Tribe Social <onboarding@resend.dev>', // Use verified domain in production
          to: [email],
          subject: 'Your Login OTP',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #3B302B;">
              <h2 style="color: #B59477;">Tribe Social</h2>
              <p>Hello,</p>
              <p>You requested an OTP to access your account. Please use the following code:</p>
              <div style="background: #FAF8F6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
                ${otpValue}
              </div>
              <p style="font-size: 12px; color: #8A7B74; margin-top: 20px;">
                This code will expire in 5 minutes. If you did not request this, please ignore this email.
              </p>
            </div>
          `,
        });

        if (error) {
          console.error("Resend Error:", error);
          return res.status(500).json({ message: 'Email service error. Try again later.' });
        }
        res.json({ message: 'OTP sent to your email.' });
      } catch (err) {
        console.error("Mail send exception:", err);
        res.status(500).json({ message: 'Failed to send OTP.' });
      }
    } else {
      // DEBUG MODE: If no API Key is set, log it to console so dev can see it in Render Logs
      console.warn("------------------------------------------");
      console.warn(`⚠️ NO RESEND_API_KEY FOUND IN ENV`);
      console.warn(`🔑 OTP FOR ${email}: ${otpValue}`);
      console.warn("------------------------------------------");
      res.json({ message: 'OTP generated (Check server logs in dev).' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpDoc = await OTP.findOne({ email });
    if (!otpDoc) return res.status(400).json({ message: 'OTP expired or not requested.' });

    if (otpDoc.attempts >= 3) {
      await OTP.deleteOne({ email });
      return res.status(403).json({ message: 'Too many failed attempts. Request a new OTP.' });
    }

    const isValid = await bcrypt.compare(otp, otpDoc.otp);
    if (!isValid) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(401).json({ message: 'Invalid OTP code.' });
    }

    const user = await User.findOne({ email });
    if (user?.isDisabled || user?.isHidden) {
      await OTP.deleteOne({ email });
      return res.status(403).json({ message: DISABLED_MESSAGE });
    }

    if (user) {
      const superAdminSet = superAdmins.map((admin) => admin.toLowerCase());
      const isSuperAdmin = superAdminSet.includes(user.username.toLowerCase());
      const isAdmin = isSuperAdmin || user.isAdmin;
      if ((isAdmin && !user.isAdmin) || (isSuperAdmin && !user.isSuperAdmin)) {
        user.isAdmin = isAdmin;
        user.isSuperAdmin = isSuperAdmin;
        await user.save();
      }
    }
    await OTP.deleteOne({ email });

    res.json({
      token: generateToken(user._id),
      user: user,
      isOtpLogin: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
