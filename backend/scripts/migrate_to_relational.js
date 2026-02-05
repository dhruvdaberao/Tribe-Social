import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import Follow from '../models/followModel.js';
import Like from '../models/likeModel.js';
import Comment from '../models/commentModel.js';
import connectDB from '../config/db.js';

dotenv.config();

const migrate = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        console.log('🚀 Starting Safe Migration...');

        // 1. Migrate Follows
        console.log('--- Migrating User Relationships ---');
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        let followCount = 0;
        for (const user of users) {
            if (user.following && user.following.length > 0) {
                for (const targetId of user.following) {
                    try {
                        await Follow.create({ follower: user._id, following: targetId });
                        followCount++;
                    } catch (e) {
                        if (e.code !== 11000) console.error(`Failed to migrate follow: ${user.username} -> ${targetId}`, e.message);
                    }
                }
            }
        }
        console.log(`✅ Migrated ${followCount} follow relationships.`);

        // 2. Update User Counts
        console.log('--- Updating User Counts ---');
        for (const user of users) {
            const followersCount = await Follow.countDocuments({ following: user._id });
            const followingCount = await Follow.countDocuments({ follower: user._id });
            await User.findByIdAndUpdate(user._id, { followersCount, followingCount });
        }
        console.log('✅ User counts updated.');

        // 3. Migrate Posts (Likes and Comments)
        console.log('--- Migrating Posts ---');
        const posts = await Post.find({});
        console.log(`Found ${posts.length} posts.`);

        let likeCount = 0;
        let commentCount = 0;

        for (const post of posts) {
            // Migrate Likes
            if (post.likes && post.likes.length > 0) {
                for (const userId of post.likes) {
                    try {
                        await Like.create({ user: userId, post: post._id });
                        likeCount++;
                    } catch (e) {
                        if (e.code !== 11000) console.error(`Failed to migrate like: ${userId} -> ${post._id}`, e.message);
                    }
                }
            }

            // Migrate Comments
            if (post.comments && post.comments.length > 0) {
                for (const comment of post.comments) {
                    try {
                        // Preserve original ID and timestamp if possible
                        await Comment.create({
                            _id: comment._id,
                            user: comment.user,
                            post: post._id,
                            text: comment.text,
                            createdAt: comment.createdAt || new Date(),
                            updatedAt: comment.updatedAt || new Date()
                        });
                        commentCount++;
                    } catch (e) {
                        if (e.code !== 11000) console.error(`Failed to migrate comment: ${comment._id}`, e.message);
                    }
                }
            }

            // Update Post Counts
            const likesCount = await Like.countDocuments({ post: post._id });
            const commentsCount = await Comment.countDocuments({ post: post._id });
            await Post.findByIdAndUpdate(post._id, { likesCount, commentsCount });
        }

        console.log(`✅ Migrated ${likeCount} likes and ${commentCount} comments.`);
        console.log('✅ Post counts updated.');

        console.log('🎉 Migration Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
};

migrate();
