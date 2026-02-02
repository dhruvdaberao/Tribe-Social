import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/userModel.js';
import Post from '../backend/models/postModel.js';
import Follow from '../backend/models/followModel.js';
import Like from '../backend/models/likeModel.js';
import Comment from '../backend/models/commentModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Config
const BATCH_SIZE = 100;
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../backend/.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const migrateFollows = async () => {
    console.log('--- Migrating Follows ---');
    let processed = 0;
    const cursor = User.find().cursor();

    for (let user = await cursor.next(); user != null; user = await cursor.next()) {
        const followsToInsert = [];

        // Migrate 'following' array
        if (user.following && user.following.length > 0) {
            for (const followingId of user.following) {
                // Deduplicate check is handled by unique index, but we can pre-check safely or just insert
                // We use bulkWrite for performance
                followsToInsert.push({
                    updateOne: {
                        filter: { follower: user._id, following: followingId },
                        update: { $setOnInsert: { follower: user._id, following: followingId } },
                        upsert: true
                    }
                });
            }
        }

        if (followsToInsert.length > 0) {
            await Follow.bulkWrite(followsToInsert);
        }

        // Update counts
        user.followingCount = user.following.length;
        user.followersCount = user.followers.length; // We trust the array length for now
        await user.save();

        processed++;
        if (processed % 100 === 0) console.log(`Processed ${processed} users...`);
    }
    console.log('--- Follows Migration Complete ---');
};

const migrateLikesAndComments = async () => {
    console.log('--- Migrating Likes & Comments ---');
    let processed = 0;
    const cursor = Post.find().cursor();

    for (let post = await cursor.next(); post != null; post = await cursor.next()) {
        const likesToInsert = [];
        const commentsToInsert = [];

        // Migrate Likes
        if (post.likes && post.likes.length > 0) {
            for (const userId of post.likes) {
                likesToInsert.push({
                    updateOne: {
                        filter: { user: userId, post: post._id },
                        update: { $setOnInsert: { user: userId, post: post._id } },
                        upsert: true
                    }
                });
            }
        }

        // Migrate Comments
        if (post.comments && post.comments.length > 0) {
            for (const comment of post.comments) {
                // Sync IDs: Use the embedded subdocument _id for the new document _id
                if (comment.user) {
                    commentsToInsert.push({
                        updateOne: {
                            filter: { _id: comment._id }, // Use existing ID
                            update: {
                                $setOnInsert: {
                                    _id: comment._id,
                                    user: comment.user,
                                    post: post._id,
                                    text: comment.text,
                                    createdAt: comment.createdAt || new Date(),
                                    updatedAt: comment.updatedAt || new Date()
                                }
                            },
                            upsert: true
                        }
                    });
                }
            }
        }

        if (likesToInsert.length > 0) await Like.bulkWrite(likesToInsert);
        if (commentsToInsert.length > 0) await Comment.bulkWrite(commentsToInsert);

        // Update Counts
        post.likesCount = post.likes.length;
        post.commentsCount = post.comments.length;
        await post.save();

        processed++;
        if (processed % 100 === 0) console.log(`Processed ${processed} posts...`);
    }
    console.log('--- Post Interactions Migration Complete ---');
};

const runMigration = async () => {
    await connectDB();
    await migrateFollows();
    await migrateLikesAndComments();
    console.log('✅ All Migrations Completed Successfully');
    process.exit();
};

runMigration();
