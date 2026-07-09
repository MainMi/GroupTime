const eventInfosModel = require('../../model/eventInfo.model');

module.exports = {
    getAllEventInfos: () => eventInfosModel.find({}).lean(),
    getEventInfoById: (eventInfoId) => eventInfosModel.findById(eventInfoId).lean(),
    getEventInfoByEventDateId: (eventDateId) => eventInfosModel.findOne({ eventDateId }).lean(),
    createEventInfo: (eventInfosObject) => eventInfosModel.create(eventInfosObject),
    createEventInfos: (eventInfosArray) => eventInfosModel.insertMany(eventInfosArray),
    // Which of the given .ics import keys already exist (for idempotent re-import).
    findImportUids: (importUids) => eventInfosModel
        .find({ importUid: { $in: importUids } })
        .select('importUid')
        .lean(),
    removeEventInfo: (filterObject) => eventInfosModel.deleteOne(filterObject),
    removeEventInfoById: (eventInfoId) => eventInfosModel.deleteOne({ _id: eventInfoId }),
    updateEventInfo: (eventInfoId, updatedObject) => eventInfosModel.findByIdAndUpdate(
        eventInfoId,
        { $set: updatedObject }
    ),

};
