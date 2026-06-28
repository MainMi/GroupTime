const ApiError = require('../error/ErrorHandler');

const {
    scheduleWeekService,
    eventInfoService,
    eventDateService,
} = require('../service/schedule');

const {
    PARAMS_IS_NOT_FOUND,
    WEEK_NOT_FOUND,
    DYNAMIC_WEEKS_NOT_FOUND,
    INVALID_SWAPPING_COUNT_WEEKS,
    INVALID_NWEEK,
    LESSON_NOT_FOUND,
    PAIR_NOT_FOUND,
    WEEK_FOUND,
} = require('../error/errorMsg');
const { scheduleDate } = require('../helper');

module.exports = {
    checkParams: (validator) => (req, res, next) => {
        try {
            const { error, value } = validator.validate(req.body);
            if (error) {
                const { status, errorStatus } = PARAMS_IS_NOT_FOUND;
                next(new ApiError(status, errorStatus, error.details[0].message));
                return;
            }

            req.body = value;

            next();
        } catch (e) {
            next(e);
        }
    },

    isWeekExist: (isFound = false, isDate = true, isStat = false) => async (req, res, next) => {
        try {
            const { date, isStatic = false, groupId } = req.body;

            let countWeek = isDate
                ? scheduleDate.getISOWeekNumber(date)
                : date.value.countWeek;

            const isStatic2 = isStat || isStatic;
            if (isStatic2) {
                const staticWeeksCount = await scheduleWeekService.countStaticWeeks(groupId);
                if (staticWeeksCount === 0) {
                    next(new ApiError(...Object.values(!isFound ? WEEK_NOT_FOUND : WEEK_FOUND)));
                    return;
                }

                countWeek %= staticWeeksCount;
            }

            const scheduleWeek = await scheduleWeekService.findWeek(groupId, countWeek, isStatic2);

            if (!isFound ? !scheduleWeek : scheduleWeek) {
                next(new ApiError(...Object.values(!isFound ? WEEK_NOT_FOUND : WEEK_FOUND)));
                return;
            }

            if (!isFound) {
                req.week = scheduleWeek;
            }

            next();
        } catch (e) {
            next(e);
        }
    },

    isDynamicWeeksExist: async (req, res, next) => {
        try {
            const { groupId } = req.body;
            const weeks = await scheduleWeekService.findAllDynamicWeeks(groupId);

            if (!weeks) {
                next(new ApiError(...Object.values(DYNAMIC_WEEKS_NOT_FOUND)));
                return;
            }

            req.dynamicWeeks = weeks;
            next();
        } catch (e) {
            next(e);
        }
    },

    checkNWeek: (req, res, next) => {
        try {
            const { countWeek } = req.body;
            if (!req.dynamicWeeks || countWeek >= req.dynamicWeeks.length) {
                next(new ApiError(...Object.values(INVALID_NWEEK)));
                return;
            }

            next();
        } catch (e) {
            next(e);
        }
    },

    checkWeekIndexesForSwapping: (req, res, next) => {
        try {
            const { countWeek1, countWeek2 } = req.body;

            req.dynamicWeeks.sort((a, b) => a.updatedAtManual - b.updatedAtManual);
            const weekIdx1 = req.dynamicWeeks.findIndex((week) => week.countWeek === countWeek1);
            const weekIdx2 = req.dynamicWeeks.findIndex((week) => week.countWeek === countWeek2);

            if (weekIdx1 === -1 || weekIdx2 === -1) {
                next(new ApiError(...Object.values(INVALID_SWAPPING_COUNT_WEEKS)));
                return;
            }

            req.swapIndexes = [
                weekIdx1,
                weekIdx2
            ];

            next();
        } catch (e) {
            next(e);
        }
    },

    isEventInfoExist: async (req, res, next) => {
        try {
            const { eventInfoId } = req.body;
            const eventInfo = await eventInfoService.getEventInfoById(eventInfoId);

            if (!eventInfo) {
                next(new ApiError(...Object.values(LESSON_NOT_FOUND)));
                return;
            }

            req.eventInfo = eventInfo;
            next();
        } catch (e) {
            next(e);
        }
    },

    isEventExist: async (req, res, next) => {
        try {
            const { extraEvent } = req.body;
            const event = await eventDateService.getOne(extraEvent);

            if (!event) {
                next(new ApiError(...Object.values(PAIR_NOT_FOUND)));
                return;
            }

            req.extraEvent = event;
            next();
        } catch (e) {
            next(e);
        }
    },
};
