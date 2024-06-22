import CustomError from '../../utils/customError.js';

const fileFilter = (req, file, callback) => {
  // Check if the file type is an image
  if (
    file.mimetype === 'image/jpeg'
    || file.mimetype === 'image/jpg'
    || file.mimetype === 'image/png'
    || file.mimetype === 'image/svg'
    || file.mimetype === 'image/webp'
  ) {
    callback(null, true); // Accept the file
  } else {
    callback(new CustomError('Solo se permiten formatos de imagen JPEG, JPG, PNG, WEBP y SVG.', 400)); // Reject the file
  }
};

export default fileFilter;
