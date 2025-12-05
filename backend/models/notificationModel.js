// import mongoose from 'mongoose';

// const notificationSchema = mongoose.Schema({
//     recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     type: { type: String, enum: ['like', 'comment', 'follow'], required: true },
//     read: { type: Boolean, default: false },
//     postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
//     commentId: { type: mongoose.Schema.Types.ObjectId },
// }, {
//     timestamps: true
// });

// notificationSchema.set('toJSON', {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString();
//     returnedObject.timestamp = returnedObject.createdAt;
//     delete returnedObject._id;
//     delete returnedObject.__v;
//     delete returnedObject.updatedAt;
//     delete returnedObject.createdAt;
//   }
// });

// const Notification = mongoose.model('Notification', notificationSchema);
// export default Notification;





import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'comment', 'follow', 'message', 'story_like', 'tribe_join'], required: true },
    read: { type: Boolean, default: false },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    tribeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tribe' },
    commentId: { type: mongoose.Schema.Types.ObjectId },
}, {
    timestamps: true
});

notificationSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.timestamp = returnedObject.createdAt;
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.updatedAt;
    delete returnedObject.createdAt;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;