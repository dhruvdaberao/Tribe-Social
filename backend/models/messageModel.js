import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  message: { type: String, default: '' },
  imageUrl: { type: String, default: null },
  attachmentUrl: { type: String, default: null },
  attachmentType: { type: String, default: null },
  attachmentName: { type: String, default: null },
  attachmentSize: { type: Number, default: null },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  deletedFor: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
}, {
  timestamps: true,
});

// Compound index for fast retrieval of chat history between two users
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

messageSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();

    // 🔥 FIX: Keep sender/receiver if populated
    if (returnedObject.sender && typeof returnedObject.sender === 'object') {
      returnedObject.sender = returnedObject.sender;
      returnedObject.senderId = returnedObject.sender._id ? returnedObject.sender._id.toString() : returnedObject.sender.toString();
    } else {
      returnedObject.senderId = returnedObject.sender.toString();
      delete returnedObject.sender;
    }

    if (returnedObject.receiver && typeof returnedObject.receiver === 'object') {
      returnedObject.receiver = returnedObject.receiver;
      returnedObject.receiverId = returnedObject.receiver._id ? returnedObject.receiver._id.toString() : returnedObject.receiver.toString();
    } else {
      returnedObject.receiverId = returnedObject.receiver.toString();
      delete returnedObject.receiver;
    }

    if (returnedObject.replyTo && typeof returnedObject.replyTo === 'object') {
      returnedObject.replyTo = returnedObject.replyTo._id ? returnedObject.replyTo._id.toString() : returnedObject.replyTo.toString();
    } else if (returnedObject.replyTo) {
      returnedObject.replyTo = returnedObject.replyTo.toString();
    }

    returnedObject.text = returnedObject.message;
    returnedObject.timestamp = returnedObject.createdAt;

    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.message;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
