import getFileFromBucket from '../../services/cloudStorage/getFileFromBucket.js';
import consts from '../../utils/consts.js';

const getUserImageController = async (req, res) => {
  const { id } = req.params;

  try {
    const fileResult = await getFileFromBucket(`${consts.bucketRoutes.user}/${id}`);
    res.write(fileResult, 'binary');
    res.end(null, 'binary');
  } catch (ex) {
    res.sendStatus(404);
  }
};
const getAreaImageController = async (req, res) => {
  const { id } = req.params;

  try {
    const fileResult = await getFileFromBucket(`${consts.bucketRoutes.area}/${id}`);
    res.write(fileResult, 'binary');
    res.end(null, 'binary');
  } catch (ex) {
    res.sendStatus(404);
  }
};

// eslint-disable-next-line import/prefer-default-export
export { getUserImageController, getAreaImageController };
