const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const playerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cricket-auction/players',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

const teamStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cricket-auction/teams',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  },
});

const auctionStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cricket-auction/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

module.exports = {
  uploadPlayer: multer({ storage: playerStorage }),
  uploadTeam: multer({ storage: teamStorage }),
  uploadAuction: multer({ storage: auctionStorage }),
  cloudinary,
};
