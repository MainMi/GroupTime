// Maps a file's mimetype / name to a coarse category used for icon selection.
// Backend File documents expose `minetypes` (mimetype) and `name`; we prefer the
// mimetype and fall back to the filename extension when it's missing/generic.

const EXTENSION_CATEGORY = {
    // images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
    bmp: 'image', svg: 'image', heic: 'image', avif: 'image',
    // pdf
    pdf: 'pdf',
    // documents
    doc: 'document', docx: 'document', rtf: 'document', odt: 'document',
    txt: 'document', md: 'document', pages: 'document',
    // spreadsheets
    xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet', ods: 'spreadsheet',
    // presentations
    ppt: 'presentation', pptx: 'presentation', odp: 'presentation', key: 'presentation',
    // archives
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
    // audio / video
    mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', m4a: 'audio',
    mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
};

const getExtension = (name = '') => {
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
};

// Returns one of:
// 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'archive' |
// 'audio' | 'video' | 'file'
export const getFileCategory = (file = {}) => {
    const mime = (file.minetypes || file.mimetype || file.type || '').toLowerCase();

    if (mime) {
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('audio/')) return 'audio';
        if (mime.startsWith('video/')) return 'video';
        if (mime === 'application/pdf') return 'pdf';
        if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return 'spreadsheet';
        if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
        if (mime.includes('word') || mime === 'application/rtf' || mime.startsWith('text/')) return 'document';
        if (mime.includes('zip') || mime.includes('compressed') || mime.includes('tar') || mime.includes('7z')) return 'archive';
    }

    const ext = getExtension(file.name);
    return EXTENSION_CATEGORY[ext] || 'file';
};

// True when the file can be shown as an inline thumbnail (raster/vector image
// reachable via its public `location` URL).
export const isImageFile = (file = {}) => getFileCategory(file) === 'image';
