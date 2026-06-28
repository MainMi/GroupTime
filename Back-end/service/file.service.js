// eslint-disable-next-line import/no-extraneous-dependencies
const AWS_S3 = require('aws-sdk/clients/s3');
const path = require('path');
const { nanoid } = require('nanoid');

const {
    S3_REGION,
    AWS_SECRET_KEY,
    AWS_ACCESS_KEY,
    S3_BUCKET_NAME
} = require('../config/config');
const fileModel = require('../model/file.model');

const S3 = new AWS_S3({
    region: S3_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
    apiVersion: 'latest',
    signatureVersion: 'v4'
});

const fileNameBuilder = (file, itemId, itemType) => {
    const extension = path.extname(file.name);

    return `image/${itemType}/${itemId}/${nanoid(9)}${extension}`;
};

module.exports = {
    uploadFileS3: (file, itemId, itemType) => {
        const Key = fileNameBuilder(file, itemId, itemType);
        return S3.upload({
            Bucket: S3_BUCKET_NAME,
            Body: file.data,
            Key,
            ACL: 'public-read',
            // Keys are unique per upload (nanoid), so the object is immutable —
            // let browsers cache it for a year instead of re-downloading.
            CacheControl: 'public, max-age=31536000, immutable',
            ContentType: file.mimetype
        }).promise();
    },
    deleteFileS3: (key) => S3.deleteObject({
        Bucket: S3_BUCKET_NAME,
        Key: key
    }).promise(),
    // Best-effort recovery of the S3 key for files saved before `key` was stored.
    keyFromLocation: (location) => {
        try {
            return decodeURIComponent(new URL(location).pathname).replace(/^\//, '');
        } catch (e) {
            return null;
        }
    },
    createFileDB: (fileObject) => fileModel.create(fileObject),
    getFileDB: (fileId) => fileModel.findById(fileId),
    deleteFileDB: (fileId) => fileModel.findByIdAndDelete(fileId)
};
