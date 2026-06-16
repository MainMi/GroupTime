module.exports = class ApiError extends Error {
    constructor(status, errorStatus = 0, message = '') {
        super(message);
        this.status = status;
        this.errorStatus = errorStatus;

        Error.captureStackTrace(this, this.constructor);
    }
};
