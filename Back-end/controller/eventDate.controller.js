const { eventDateService } = require('../service/schedule');
const { fileService } = require('../service');
const { deleteFileS3, keyFromLocation } = require('../service/file.service');
const ApiError = require('../error/ErrorHandler');
const {
    EVENTDATE_NOT_FOUND, MAX_EVENT_FILES_FN, PARAMS_IS_NOT_FOUND_FN
} = require('../error/errorMsg');
const { MAX_EVENT_FILES } = require('../constant/event.enum');

module.exports = {
    addFileEventDate: async (req, res, next) => {
        try {
            const { eventDateId } = req.body;

            const eventDate = await eventDateService.getOne(eventDateId);

            if (!eventDate) {
                return next(new ApiError(...Object.values(EVENTDATE_NOT_FOUND)));
            }

            if ((eventDate.data?.length || 0) >= MAX_EVENT_FILES) {
                return next(new ApiError(...Object.values(MAX_EVENT_FILES_FN(MAX_EVENT_FILES))));
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
                return next(new ApiError(...Object.values(PARAMS_IS_NOT_FOUND_FN('eventDateId|fileId'))));
            }

            const file = await fileService.getFileDB(fileId);
            if (file) {
                const key = file.key || keyFromLocation(file.location);
                if (key) {
                    try {
                        await deleteFileS3(key);
                    } catch (e) {
                        console.error('S3 event file delete failed -', e.message);
                    }
                }
                await fileService.deleteFileDB(fileId);
            }

            await eventDateService.removeFileEventDate(fileId, eventDateId);

            res.json('File deleted');
        } catch (e) {
            next(e);
        }
    }
};
