// import { v2 as cloudinary } from 'cloudinary';
// import dotenv from 'dotenv';

// dotenv.config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// /**
//  * Uploads a base64 image string to Cloudinary and returns the secure URL.
//  * Optimized for Tribe Feed performance.
//  */
// export const uploadImage = async (base64Image, folder = 'tribe_posts') => {
//   if (!base64Image || !base64Image.startsWith('data:image')) return null;

//   try {
//     const result = await cloudinary.uploader.upload(base64Image, {
//       folder: `tribe/${folder}`,
//       resource_type: 'image',
//       quality: 'auto',
//       fetch_format: 'auto', // Automatically converts to WebP for speed
//     });
//     return result.secure_url;
//   } catch (error) {
//     console.error('Cloudinary Upload Error:', error);
//     return null;
//   }
// };

// export default cloudinary;





import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// CRITICAL FIX: Trim whitespace/newlines that might be injected by copy-pasting into hosting providers
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const api_key = process.env.CLOUDINARY_API_KEY?.trim();
const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

/**
 * Uploads a base64 image string to Cloudinary and returns the secure URL.
 * Optimized for Tribe Feed performance.
 */
export const uploadImage = async (base64Image, folder = 'tribe_posts') => {
  if (!base64Image || !base64Image.startsWith('data:image')) return null;

  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `tribe/${folder}`,
      resource_type: 'image',
      // Standardize quality to reduce size and improve loading speed
      quality: '70', 
      fetch_format: 'webp', // WebP is significantly faster for mobile/web
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error; // Throw so the route can catch it and return 500
  }
};

export default cloudinary;