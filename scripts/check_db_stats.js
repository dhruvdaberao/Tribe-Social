import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../backend/models/userModel.js';
import Post from '../backend/models/postModel.js';
import Follow from '../backend/models/followModel.js';
import Like from '../backend/models/likeModel.js';

const check = async () => {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        console.log("Counting Users...");
        const users = await User.countDocuments();
        console.log(`Users: ${users}`);

        console.log("Counting Posts...");
        const posts = await Post.countDocuments();
        console.log(`Posts: ${posts}`);

        console.log("Counting Follows...");
        const follows = await Follow.countDocuments();
        console.log(`Follows: ${follows}`);

        console.log("Counting Likes...");
        const likes = await Like.countDocuments();
        console.log(`Likes: ${likes}`);

        process.exit(0);
    } catch (e) {
        console.log("ERROR IN SCRIPT:", e.message); // Log to stdout
        console.log(e);
        process.exit(1);
    }
};
check();
