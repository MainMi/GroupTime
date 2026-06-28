// Read a (possibly nested) value by dot-path, e.g. getByPath(obj, 'a.b.c').
const getByPath = (obj, path) => String(path || '')
    .split('.')
    .reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

module.exports = { getByPath };
