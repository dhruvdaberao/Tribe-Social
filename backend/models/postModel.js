// import mongoose from 'mongoose';

// const commentSchema = mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
//     text: { type: String, required: true },
//   },
//   {
//     timestamps: { createdAt: true, updatedAt: false }
//   }
// );

// commentSchema.set('toJSON', {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString();
//     returnedObject.timestamp = returnedObject.createdAt;
//     delete returnedObject._id;
//     delete returnedObject.createdAt;
//     delete returnedObject.updatedAt;
//   }
// });

// const postSchema = mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
//     content: { type: String, required: function() { return !this.imageUrl; } },
//     imageUrl: { type: String },
//     likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     comments: [commentSchema],
//   },
//   {
//     timestamps: true,
//   }
// );

// postSchema.set('toJSON', {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString();
//     returnedObject.timestamp = returnedObject.createdAt;
//     delete returnedObject._id;
//     delete returnedObject.__v;
//     delete returnedObject.createdAt;
//     delete returnedObject.updatedAt;
//   }
// });

// const Post = mongoose.model('Post', postSchema);
// export default Post;






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
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
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