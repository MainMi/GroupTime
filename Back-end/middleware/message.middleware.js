const { sessionService } = require('../service');

module.exports = {
    isValidSession: async (req, res, next) => {
        try {
            const { sessionId } = req.body;

            if (!sessionId) {
                return next();
            }

            const session = await sessionService.getSession({ id: sessionId });

            const today = new Date();

            if (!session || (!session.isActive && session.endedAt && new Date(session.endedAt) < today)) {
                return next();
            }

            req.session = session;
            req.today = today;
            next();
        } catch (e) {
            next(e);
        }
    }
};
