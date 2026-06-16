const { sessionService } = require('../service');

module.exports = {
    getActiveSession: async (req, res, next) => {
        try {
            const { sessionId } = req.body;
            const { authUser: user } = req;

            let session;

            if (sessionId) {
                session = await sessionService.findSession({ _id: sessionId });
            } else {
                session = await sessionService.findSession({ isActive: true });
            }

            const today = new Date();

            const isSessionInvalid = !session?.isActive || (session?.endedAt && new Date(session.endedAt) < today);

            if (isSessionInvalid) {
                if (session?.id) {
                    await sessionService.updateSession({ id: session.id }, { isActive: false });
                }
                session = await sessionService.createSession({ userId: user._id });
            }

            req.session = session;

            next();
        } catch (e) {
            next(e);
        }
    }
};
