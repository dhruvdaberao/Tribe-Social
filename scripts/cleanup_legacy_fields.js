import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/userModel.js';
import Post from '../backend/models/postModel.js';

dotenv.config({ path: 'backend/.env' }); // Adjust if needed

const cleanupOldFields = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        console.log("--- Starting Legacy Field Cleanup ---");

        // 1. Clean Users (followers, following)
        const userResult = await User.updateMany(
            {},
            { $unset: { followers: "", following: "" } }
        );
        console.log(`✅ Users Processed: Unset legacy arrays for ${userResult.matchedCount} users.`);

        // 2. Clean Posts (likes, comments)
        const postResult = await Post.updateMany(
            {},
            { $unset: { likes: "", comments: "" } }
        );
        console.log(`✅ Posts Processed: Unset legacy arrays for ${postResult.matchedCount} posts.`);

        console.log("-------------------------------------");
        console.log("🎉 Cleanup Complete! Legacy arrays are gone.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Cleanup Failed:", error);
        process.exit(1);
    }
};

cleanupOldFields();
