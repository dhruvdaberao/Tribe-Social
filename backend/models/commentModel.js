import mongoose from 'mongoose';

const commentSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
        text: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

// Index on post for faster comment retrieval for a specific post
commentSchema.index({ post: 1, createdAt: 1 });

commentSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        returnedObject.timestamp = returnedObject.createdAt;
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.updatedAt;
    }
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
