
const testImports = async () => {
    try {
        console.log("Importing mongoose...");
        await import('mongoose');
        console.log("✅ mongoose loaded");

        console.log("Importing dotenv...");
        await import('dotenv/config');
        console.log("✅ dotenv loaded");

        console.log("Importing userModel...");
        await import('../backend/models/userModel.js');
        console.log("✅ userModel loaded");

        console.log("Importing postModel...");
        await import('../backend/models/postModel.js');
        console.log("✅ postModel loaded");

        console.log("Importing followModel...");
        await import('../backend/models/followModel.js');
        console.log("✅ followModel loaded");

        console.log("Importing likeModel...");
        await import('../backend/models/likeModel.js');
        console.log("✅ likeModel loaded");

        console.log("Importing commentModel...");
        await import('../backend/models/commentModel.js');
        console.log("✅ commentModel loaded");

    } catch (e) {
        console.error("❌ CRASH DURING IMPORT:", e);
    }
};

testImports();
