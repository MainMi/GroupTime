const { eventDateService } = require('../service/schedule');
const { fileService } = require('../service');
const fileModel = require('../model/file.model');
const { deleteFileS3 } = require('../service/file.service');
const ApiError = require('../error/ErrorHandler');

const MAX_EVENT_FILES = 5;

// Best-effort recovery of the S3 key for files saved before `key` was stored.
const keyFromLocation = (location) => {
    try {
        return decodeURIComponent(new URL(location).pathname).replace(/^\//, '');
    } catch (e) {
        return null;
    }
};

module.exports = {
    addFileEventDate: async (req, res, next) => {
        try {
            const { eventDateId } = req.body;

            const eventDate = await eventDateService.getOne(eventDateId);

            if (!eventDate) {
                return next(new ApiError(404, 4058, 'EventDate not found'));
            }

            // Enforce the per-event file limit BEFORE uploading anything.
            if ((eventDate.data?.length || 0) >= MAX_EVENT_FILES) {
                return next(new ApiError(400, 0, `Max ${MAX_EVENT_FILES} files per event`));
            }

            const {
                name, size, mimetype, types
            } = req.files.data;

            const { Location: location, Key: key } = await fileService.uploadFileS3(
                req.files.data,
                eventDate._id,
                'eventFile'
            );

            const fileDoc = await fileService.createFileDB({
                name,
                size,
                minetypes: mimetype,
                types,
                location,
                key,
                timeDeaf: false
            });

            await eventDateService.addFileEventDate(fileDoc._id, eventDate._id);

            res.json({
                _id: fileDoc._id,
                name: fileDoc.name,
                size: fileDoc.size,
                location: fileDoc.location
            });
        } catch (e) {
            next(e);
        }
    },

    deleteFileEventDate: async (req, res, next) => {
        try {
            const { eventDateId, fileId } = req.body;

            if (!eventDateId || !fileId) {
                return next(new ApiError(400, 0, 'eventDateId and fileId are required'));
            }

            const file = await fileModel.findById(fileId);
            if (file) {
                const key = file.key || keyFromLocation(file.location);
                if (key) {
                    try {
                        await deleteFileS3(key);
                    } catch (e) {
                        console.error('S3 event file delete failed -', e.message);
                    }
                }
                await fileModel.findByIdAndDelete(fileId);
            }

            await eventDateService.removeFileEventDate(fileId, eventDateId);

            res.json('File deleted');
        } catch (e) {
            next(e);
        }
    }
};
