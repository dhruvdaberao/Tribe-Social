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
import nodemailer from 'nodemailer';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Email Transporter Config
// Note: In production, add EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS to .env
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'An account with this email already exists.' });
    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ message: 'This username is already taken.' });
    const user = await User.create({ name, username, email, password });
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
    if (user && (await user.matchPassword(password))) {
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

    // Generate 6-digit OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpValue, 10);

    // Save to DB (expires in 5 mins)
    await OTP.deleteMany({ email }); // Clear previous OTPs
    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Send Email (Using a try-catch for local dev convenience if email isn't set up)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"Tribe Social" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your Login OTP",
          text: `Your Tribe Social login OTP is: ${otpValue}. This code expires in 5 minutes.`,
          html: `<b>Your Tribe Social login OTP is: <span style="font-size: 20px;">${otpValue}</span></b><p>This code expires in 5 minutes.</p>`
        });
      } else {
        console.log(`[DEV MODE] OTP for ${email}: ${otpValue}`);
      }
      res.json({ message: 'OTP sent to your email.' });
    } catch (mailError) {
      console.error("Mail Error:", mailError);
      res.status(500).json({ message: 'Failed to send email. Check server config.' });
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

    // OTP Correct
    const user = await User.findOne({ email });
    await OTP.deleteOne({ email });

    res.json({
      token: generateToken(user._id),
      user: user,
      isOtpLogin: true // Flag to show "change password" reminder
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
