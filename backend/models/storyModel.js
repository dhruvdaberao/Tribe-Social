// import mongoose from 'mongoose';

// const storySchema = mongoose.Schema({
//     user: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'User', 
//         required: true, 
//         index: true 
//     },
//     imageUrl: { 
//         type: String 
//     },
//     text: { 
//         type: String 
//     },
//     textPosition: { 
//         x: { type: Number, default: 50 }, 
//         y: { type: Number, default: 50 } 
//     },
//     imagePosition: {
//         x: { type: Number, default: 0 },
//         y: { type: Number, default: 0 }
//     },
//     createdAt: { 
//         type: Date, 
//         default: Date.now, 
//         expires: '24h' // TTL index for automatic 24-hour deletion
//     }
// }, { 
//     timestamps: false // Use createdAt for TTL, no need for updatedAt
// });

// storySchema.set('toJSON', {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString();
//     returnedObject.createdAt = returnedObject.createdAt.toISOString();
//     delete returnedObject._id;
//     delete returnedObject.__v;
//   }
// });

// const Story = mongoose.model('Story', storySchema);
// export default Story;






import mongoose from 'mongoose';

const storySchema = mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    imageUrl: { 
        type: String 
    },
    text: { 
        type: String 
    },
    textPosition: { 
        x: { type: Number, default: 50 }, 
        y: { type: Number, default: 50 } 
    },
    imagePosition: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: '24h' // TTL index for automatic 24-hour deletion
    }
}, { 
    timestamps: false // Use createdAt for TTL, no need for updatedAt
});

storySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.createdAt = returnedObject.createdAt.toISOString();
    
    // Manually add populated author if it exists
    if (returnedObject.user && returnedObject.user._id) {
      returnedObject.author = {
        id: returnedObject.user._id.toString(),
        name: returnedObject.user.name,
        username: returnedObject.user.username,
        avatarUrl: returnedObject.user.avatarUrl
      };
    }

    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Story = mongoose.model('Story', storySchema);
export default Story;