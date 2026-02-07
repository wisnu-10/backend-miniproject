import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

// Cloudinary automatically reads CLOUDINARY_URL from environment variables
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
cloudinary.config();

export default cloudinary;
