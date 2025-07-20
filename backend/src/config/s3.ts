import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();


AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();

export const uploadToS3 = async (file: Buffer, fileName: string, contentType: string): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileName,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const deleteFromS3 = async (fileName: string): Promise<void> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileName,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export const getSignedUrl = async (fileName: string, expiresIn: number = 3600): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileName,
    Expires: expiresIn,
  };

  try {
    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

export default s3; 