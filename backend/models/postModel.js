import mongoose from 'mongoose';

const commentSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    text: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

commentSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.timestamp = returnedObject.createdAt;
    delete returnedObject._id;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  }
});

const postSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    content: { type: String, required: function() { return !this.imageUrl; } },
    imageUrl: { type: String, default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for recovery
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });

postSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    // CRITICAL: Ensure frontend always has a string ID to prevent 'undefined/like' routes
    returnedObject.id = returnedObject._id.toString();
    returnedObject.timestamp = returnedObject.createdAt;
    
    // Ensure author/user parity during recovery
    if (returnedObject.author && !returnedObject.user) returnedObject.user = returnedObject.author;
    if (returnedObject.user && !returnedObject.author) returnedObject.author = returnedObject.user;

    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  }
});

const Post = mongoose.model('Post', postSchema);
export default Post;