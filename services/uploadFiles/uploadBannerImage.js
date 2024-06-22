import multer from 'multer';
import fileFilter from './fileFilter.js';
import storage from './storage.js';
import consts from '../../utils/consts.js';

const limits = {
  fileSize: consts.uploadFileSizeLimit.banner,
};

export default multer({ storage, fileFilter, limits });
