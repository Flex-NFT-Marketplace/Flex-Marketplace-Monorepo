import { Injectable, Logger, Put } from '@nestjs/common';
// this imports a bare-bones version of S3 that exposes the .send operation
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
import sharp from 'sharp';

// this imports just the getObject operation from S3
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UploadService {
  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
  });
  private logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadImage(filename: string, file: Buffer) {
    try {
      const resizedImage = await sharp(file)
        // .resize({ width: 272, height: 272 }) // Set the width and height
        .jpeg({ quality: 100 }) // Convert to JPEG format
        .png({ compressionLevel: 9 }) // Increase compression level for PNG outputs
        // .webp({ quality: 100 }) // Convert to WebP format
        .toBuffer();

      // Upload the image to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: 'flex-marketplace',
          Key: `warpcast/ipfs/${filename}.webp`,
          Body: resizedImage,
        }),
      );

      const urlImage = await this.getUrlFile(`warpcast/ipfs/${filename}.webp`);

      return this.convertPath(urlImage);
    } catch (error) {
      this.logger.error(`Failed to upload image: ${error}`);
    }
  }

  async getUrlFile(fileName: string) {
    const command = new GetObjectCommand({
      Bucket: 'flex-marketplace',
      Key: fileName,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 36000,
    });

    return url;
  }

  convertPath(path: string): string {
    const parsedUrl = new URL(path);

    const protocol = parsedUrl.protocol;
    const hostname = parsedUrl.hostname;
    const pathname = parsedUrl.pathname;

    return protocol + '//' + hostname + pathname;
  }

  async downloadImage(url: string, filename: string): Promise<any> {
    try {
      if (url != null) {
        const rs = (
          await axios({
            url: url,
            responseType: 'arraybuffer',
          })
        ).data as Buffer;

        const resizedImage = await sharp(rs)
          .resize({ width: 272, height: 272 }) // Set the width and height
          .jpeg({ quality: 100 }) // Convert to JPEG format
          .png({ compressionLevel: 9 }) // Increase compression level for PNG outputs
          .webp({ quality: 100 }) // Convert to WebP format
          .toBuffer();

        // Upload the image to S3
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: 'flex-marketplace',
            Key: filename,
            Body: resizedImage,
          }),
        );

        const urlImage = await this.getUrlFile(filename);

        return this.convertPath(urlImage);
      }

      return url;
    } catch (error) {
      console.error(`Failed to download image: ${error.message}`);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }
}
