import mongoose from 'mongoose';
import 'dotenv/config';
import fs from 'fs';
import User from '../backend/models/userModel.js';
import Post from '../backend/models/postModel.js';
import Follow from '../backend/models/followModel.js';

const log = (msg) => {
    fs.appendFileSync('isolation_log.txt', msg + '\n');
    console.log(msg);
};

const check = async () => {
    try {
        fs.writeFileSync('isolation_log.txt', 'Start...\n');
        await mongoose.connect(process.env.MONGO_URI);
        log("Connected.");

        try {
            log("Checking Users...");
            const users = await User.countDocuments();
            log(`Users: ${users}`);
        } catch (e) { log(`User Check Error: ${e.message}`); }

        try {
            log("Checking Posts...");
            const posts = await Post.countDocuments();
            log(`Posts: ${posts}`);
        } catch (e) { log(`Post Check Error: ${e.message}`); }

        try {
            log("Checking Follows...");
            const follows = await Follow.countDocuments();
            log(`Follows: ${follows}`);
        } catch (e) { log(`Follow Check Error: ${e.message}`); }

        process.exit(0);
    } catch (e) {
        log(`Main Error: ${e.message}`);
        process.exit(1);
    }
};
check();
