import mongoose from 'mongoose';

const likeSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true }
}, { timestamps: true });

// Ensure a user can like a post only once
likeSchema.index({ user: 1, post: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
export default Like;
