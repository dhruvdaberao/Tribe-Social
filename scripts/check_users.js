import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../backend/models/userModel.js';
import Post from '../backend/models/postModel.js';

// Minimal check to isolate Schema issues
const check = async () => {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");
        console.log("Users:", await User.countDocuments());
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();
