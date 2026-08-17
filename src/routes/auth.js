import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import { login, logout, getCurrentUser, getTenants, register, updateLicenceExpiry, sendOtp, verifyOtp, resetPassword, getSettings, updateSettings } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure Storage
let upload;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'HallMarking CRM Software',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg']
    }
  });
  upload = multer({ storage: storage });
} else {
  // Fallback to local storage if Cloudinary not configured
  import('path').then(path => {
    import('url').then(url => {
      const __filename = url.fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, path.join(__dirname, '../../public/uploads/'))
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
          cb(null, uniqueSuffix + path.extname(file.originalname))
        }
      });
      upload = multer({ storage: storage });
    });
  });
}

const router = express.Router();

router.get('/tenants', getTenants);
router.post('/login', login);
router.post('/register', register);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);
router.post('/update-licence-expiry', requireAuth, updateLicenceExpiry);
router.get('/settings', requireAuth, getSettings);
router.put('/settings', requireAuth, updateSettings);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Use a middleware wrapper for upload because it might be asynchronously initialized for local storage fallback
router.post('/upload', (req, res, next) => {
  if (upload) {
    upload.single('logo')(req, res, next);
  } else {
    // If not ready, wait a bit (only happens in first milliseconds if fallback)
    setTimeout(() => upload.single('logo')(req, res, next), 100);
  }
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // If uploaded to Cloudinary, req.file.path contains the URL
  // If local, we need to construct it
  const url = req.file.path || `/public/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
