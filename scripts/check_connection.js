import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../backend/models/userModel.js';
import Post from '../backend/models/postModel.js';
import Follow from '../backend/models/followModel.js';

const check = async () => {
    try {
        const uri = process.env.MONGO_URI;
        console.log("URI found:", !!uri);
        console.log("Connecting to DB...");

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ CONNECTED");

        console.log("Users:", await User.countDocuments());
        console.log("Posts:", await Post.countDocuments());
        console.log("Follows:", await Follow.countDocuments());

        process.exit(0);
    } catch (e) {
        console.error("❌ CONNECT ERROR:", e);
        process.exit(1);
    }
};
check();
