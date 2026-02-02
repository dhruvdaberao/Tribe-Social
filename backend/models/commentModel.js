import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    text: { type: String, required: true },
}, { timestamps: true });

// Index for efficiently fetching comments for a specific post
commentSchema.index({ post: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
