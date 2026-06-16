const eventDateModel = require('../../model/eventDate.model');

module.exports = {
    addEventDate: (
        day,
        time,
        duration,
        countWeek,
        data,
    ) => eventDateModel.create(
        {
            countWeek,
            day,
            time,
            duration,
            data
        }
    ),

    updateEventDate: (eventDateId, updateData) => eventDateModel.updateOne(
        { _id: eventDateId },
        { $set: updateData }
    ),

    deleteEventDate: (
        countWeek,
        day,
        time
    ) => eventDateModel.deleteMany(
        {
            countWeek,
            day,
            time,
        }
    ),

    deleteEventDateById: (id) => eventDateModel.deleteOne({ _id: id }),

    deleteEventDateManyById: (arrId) => eventDateModel.deleteMany({ _id: { $in: arrId } }),

    setCountWeekManyById: (arrId, countWeek) => eventDateModel.updateMany(
        { _id: { $in: arrId } },
        { $set: { countWeek } }
    ),

    updateEventDateById: (
        id,
        newData,
        countWeek,
        day,
        time,
        duration
    ) => eventDateModel.updateOne(
        {
            _id: id
        },
        {
            countWeek,
            day,
            time,
            duration,
            data: newData
        },
        {
            upsert: true
        }
    ),

    addFileEventDate: (file, eventDateId) => eventDateModel.findByIdAndUpdate(
        eventDateId,
        {
            $push: {
                data: file
            }
        }
    ),

    removeFileEventDate: (fileId, eventDateId) => eventDateModel.findByIdAndUpdate(
        eventDateId,
        {
            $pull: {
                data: fileId
            }
        }
    ),

    getOne: (eventDateId) => eventDateModel.findById(eventDateId).lean(),

    getAll: () => eventDateModel.find({}).lean(),
    updateEventDateByEventInfoId: async (
        eventInfoId,
        countWeek,
        day,
        time,
        duration
    ) => {
        const eventDate = await eventDateModel.findOne({ eventInfo: eventInfoId });

        if (eventDate) {
            return eventDateModel.updateOne(
                { _id: eventDate._id },
                {
                    countWeek,
                    day,
                    time,
                    duration
                }
            );
        }
        return null;
    },
};
