
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error("FATAL: MONGO_URI is not defined in your environment variables. Please check your .env file or your hosting provider's environment variable settings.");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // This log confirms a successful connection. If you don't see this, the connection failed.
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("\n--- DATABASE CONNECTION FAILED ---");
    console.error(`Error: ${error.message}`);
    console.error("\nTroubleshooting tips:");
    console.error("1. Verify that your MONGO_URI is correct in your .env file or hosting environment variables.");
    console.error("2. Ensure the database user's password is correct and has read/write permissions.");
    console.error("3. Check that your current IP address is whitelisted in MongoDB Atlas under 'Network Access'.");
    console.error("----------------------------------\n");
    // Exit the process with failure code, which prevents the server from starting with a bad DB connection.
    process.exit(1);
  }
};

export default connectDB;
