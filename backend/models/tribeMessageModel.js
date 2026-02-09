import mongoose from 'mongoose';

const tribeMessageSchema = mongoose.Schema(
  {
    tribe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tribe',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: null
    },
    attachmentUrl: {
      type: String,
      default: null
    },
    attachmentType: {
      type: String,
      default: null
    },
    attachmentName: {
      type: String,
      default: null
    },
    attachmentSize: {
      type: Number,
      default: null
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TribeMessage',
      default: null
    },
    deletedFor: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    }
  },
  {
    timestamps: true,
  }
);

// Index for fast retrieval of tribe messages
tribeMessageSchema.index({ tribe: 1, createdAt: -1 });

tribeMessageSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.tribeId = returnedObject.tribe.toString();

    // 🔥 FIX: Ensure sender info isn't stripped!
    if (returnedObject.sender && typeof returnedObject.sender === 'object') {
      returnedObject.sender = returnedObject.sender; // Keep the populated object
      returnedObject.senderId = returnedObject.sender._id ? returnedObject.sender._id.toString() : returnedObject.sender.toString();
    } else {
      returnedObject.senderId = returnedObject.sender.toString();
      delete returnedObject.sender; // Only delete if it's just an ID
    }

    if (returnedObject.replyTo && typeof returnedObject.replyTo === 'object') {
      returnedObject.replyTo = returnedObject.replyTo._id ? returnedObject.replyTo._id.toString() : returnedObject.replyTo.toString();
    } else if (returnedObject.replyTo) {
      returnedObject.replyTo = returnedObject.replyTo.toString();
    }

    returnedObject.timestamp = returnedObject.createdAt;
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.tribe;
    // delete returnedObject.sender; // REMOVED CAUSE OF BUG
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  }
});

const TribeMessage = mongoose.model('TribeMessage', tribeMessageSchema);
export default TribeMessage;
