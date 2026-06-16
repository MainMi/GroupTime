// Shared avatar/gallery logic used by both the user and group controllers, so the
// upload → gallery-trim → delete behaviour lives in one place instead of being
// duplicated. Works against any model that has `avatar` + `avatarGallery` fields.
const fileModel = require('../model/file.model');
const { IMAGE_TYPE } = require('../constant/type/fileType.enum');
const { uploadFileS3, deleteFileS3 } = require('./file.service');

const MAX_AVATAR_GALLERY = 5;

// Best-effort recovery of the S3 key for files saved before `key` was stored.
const keyFromLocation = (location) => {
    try {
        return decodeURIComponent(new URL(location).pathname).replace(/^\//, '');
    } catch (e) {
        return null;
    }
};

const deleteAvatarFile = async (file) => {
    if (!file) return;
    const key = file.key || keyFromLocation(file.location);
    if (key) {
        try {
            await deleteFileS3(key);
        } catch (e) {
            console.error('S3 avatar delete failed -', e.message);
        }
    }
    await fileModel.findByIdAndDelete(file._id);
};

// Upload the raw (express-fileupload) file to S3 and record it as a File doc.
const uploadAvatar = async (rawFile, ownerId, ownerType) => {
    const { name, size, mimetype } = rawFile;
    const { Location: location, Key: key } = await uploadFileS3(rawFile, ownerId, ownerType);
    return fileModel.create({
        name,
        size,
        minetypes: mimetype,
        types: IMAGE_TYPE,
        location,
        key,
        timeDeaf: false
    });
};

// Add a freshly uploaded file to the owner's gallery, make it active, and evict
// (and delete from S3) the oldest entries beyond MAX_AVATAR_GALLERY.
const applyGalleryUpload = async (Model, ownerId, fileDoc) => {
    const owner = await Model.findById(ownerId).select('avatarGallery');
    const gallery = [
        ...(owner?.avatarGallery || []),
        fileDoc._id
    ];

    let evicted = [];
    if (gallery.length > MAX_AVATAR_GALLERY) {
        evicted = gallery.splice(0, gallery.length - MAX_AVATAR_GALLERY);
    }

    await Model.findByIdAndUpdate(ownerId, {
        $set: { avatar: fileDoc._id, avatarGallery: gallery }
    });

    await Promise.all(evicted.map(async (id) => {
        const file = await fileModel.findById(id);
        await deleteAvatarFile(file);
    }));

    return fileDoc.location;
};

// Make an existing gallery photo the active avatar. Returns false if the file
// isn't part of this owner's gallery.
const selectFromGallery = async (Model, ownerId, fileId) => {
    const owner = await Model.findById(ownerId).select('avatarGallery');
    const inGallery = (owner?.avatarGallery || []).some((id) => String(id) === String(fileId));
    if (!inGallery) return false;

    await Model.findByIdAndUpdate(ownerId, { $set: { avatar: fileId } });
    return true;
};

// Remove a photo from the gallery (and S3). If it was the active avatar, repoint
// it to the newest remaining photo (or null). Returns false if not in the gallery.
const removeFromGallery = async (Model, ownerId, fileId) => {
    const owner = await Model.findById(ownerId).select('avatar avatarGallery');
    const gallery = (owner?.avatarGallery || []).map(String);
    if (!gallery.includes(String(fileId))) return false;

    const remaining = gallery.filter((id) => id !== String(fileId));
    const update = { avatarGallery: remaining };
    if (String(owner.avatar) === String(fileId)) {
        update.avatar = remaining.length ? remaining[remaining.length - 1] : null;
    }

    await Model.findByIdAndUpdate(ownerId, { $set: update });

    const file = await fileModel.findById(fileId);
    await deleteAvatarFile(file);
    return true;
};

module.exports = {
    MAX_AVATAR_GALLERY,
    uploadAvatar,
    applyGalleryUpload,
    selectFromGallery,
    removeFromGallery
};
