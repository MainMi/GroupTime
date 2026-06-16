const { Schema, model } = require('mongoose');

const fileSchema = new Schema({
    name: { type: String, required: true },
    size: { type: String, required: true },
    minetypes: { type: String, required: true },
    location: { type: String, required: true, index: true },
    // S3 object key — kept so the file can be deleted from the bucket later.
    key: { type: String },
    types: { type: String, required: true, index: true },
    timeDeaf: { type: String, default: '7d' }
});

module.exports = model('File', fileSchema);
