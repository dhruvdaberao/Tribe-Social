import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../backend/models/userModel.js';
import Post from '../backend/models/postModel.js';
import Follow from '../backend/models/followModel.js';

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        try {
            console.log("Checking Users...");
            const users = await User.countDocuments();
            console.log("Users:", users);
        } catch (e) { console.error("User check failed:", e); }

        try {
            console.log("Checking Posts...");
            const posts = await Post.countDocuments();
            console.log("Posts:", posts);
        } catch (e) { console.error("Post check failed:", e); }

        try {
            console.log("Checking Follows...");
            const follows = await Follow.countDocuments();
            console.log("Follows:", follows);
        } catch (e) { console.error("Follow check failed:", e); }

        process.exit(0);
    } catch (e) {
        console.error("Main Error:", e);
        process.exit(1);
    }
};
check();
