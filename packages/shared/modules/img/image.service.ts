import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';
import * as path from 'path';
import configuration from '@app/shared/configuration';

export enum FILEIMAGETYE {
  LOGO = 'logo',
  BANNER = 'banner',
}
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};
export const editFileName = (req, file, callback) => {
  // const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const uniqueName = uuidv4();
  const newFileName = `${uniqueName}${fileExtName}`;

  callback(null, newFileName);
};

export const resizeImageCustom = async (file, body) => {
  const fileType = body.fileType || 'logo';
  const { width, height } =
    configuration().image_dimension[fileType] ||
    configuration().image_dimension.logo;

  if (!width || !height) {
    throw new Error('Invalid image dimensions');
  }

  const tempFilePath = path.join(file.destination, `temp-${file.filename}`);
  console.log('Temporary file path:', tempFilePath);

  try {
    if (fileType === 'logo' || fileType === 'banner') {
      console.log('Resizing process started...');
      await sharp(file.path).resize(width, height).toFile(tempFilePath);

      console.log('Deleting original file...');
      fs.unlinkSync(file.path);

      console.log('Renaming temporary file...');
      if (fs.existsSync(`${file.destination}/${file.filename}`)) {
        fs.unlinkSync(`${file.destination}/${file.filename}`);
      }
      fs.renameSync(tempFilePath, `${file.destination}/${file.filename}`);
    }
  } catch (error) {}
};
