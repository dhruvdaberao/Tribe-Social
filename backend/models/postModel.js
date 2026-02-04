
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
    content: { type: String, required: function () { return !this.imageUrl; } },
    imageUrl: { type: String }, // Backwards compatibility (used for both image and video URL)
    imagePublicId: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    duration: { type: Number }, // In seconds, for videos
    // Deprecated Arrays (Kept for migration safety)
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    // New Scalable Count Fields
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    // Moderation
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who reported this post
  },
  {
    timestamps: true,
  }
);

// Index to optimize sorting posts by creation date
postSchema.index({ createdAt: -1 });

postSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.timestamp = returnedObject.createdAt;
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  }
});

const Post = mongoose.model('Post', postSchema);
export default Post;