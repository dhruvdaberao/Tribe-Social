import cloudinary from '../config/cloudinary.js';

/**
 * Uploads a Base64 image string to Cloudinary.
 * @param {string} base64String - The Base64 string of the image.
 * @param {string} folder - The folder in Cloudinary to upload to.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export const uploadBase64ToCloudinary = async (base64String, folder = 'tribe_uploads') => {
    if (!base64String || !base64String.startsWith('data:')) {
        return base64String; // Return as is if it's already a URL or empty
    }

    try {
        const uploadResponse = await cloudinary.uploader.upload(base64String, {
            folder: folder,
            resource_type: 'image',
        });
        return uploadResponse.secure_url;
    } catch (error) {
        console.error(`❌ Cloudinary Upload Error (Folder: ${folder}):`, error);
        throw new Error('Image upload failed');
    }
};
