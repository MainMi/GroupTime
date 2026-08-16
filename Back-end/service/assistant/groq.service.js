const Groq = require('groq-sdk');
const { GROQ_API_KEY, DEFAULT_MODEL } = require('../../config/config');
const { generatePrompt } = require('../../helper');
const ApiError = require('../../error/ErrorHandler');
const { ASSISTANT_REQUEST_FAILED } = require('../../error/errorMsg');
const { GROQ_TEMPERATURE } = require('../../constant/assistant.enum');
const logger = require('../../config/logger');

const groq = new Groq({ apiKey: GROQ_API_KEY });

// Groq rejects a request for very different reasons — missing or expired key,
// a model name that was renamed or decommissioned, a rate limit — but the client
// only ever sees one opaque 403. Keep the client message generic (the upstream
// text can name the key) and log the real reason so it is visible in the logs.
const assistantFailed = (operation, e) => {
    const reason = e?.error?.error?.message || e?.message || String(e);
    logger.error({ err: reason, operation, model: DEFAULT_MODEL }, 'groq request failed');
    return new ApiError(...Object.values(ASSISTANT_REQUEST_FAILED));
};

// An unset key or model fails every single call, which looks like an assistant
// outage rather than the deployment misconfiguration it is. Name it instead.
const assertConfigured = () => {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
    if (!DEFAULT_MODEL) throw new Error('DEFAULT_MODEL is not set');
};

module.exports = {
    getGroqResponse: async (userMessage, groundData, model = DEFAULT_MODEL) => {
        try {
            assertConfigured();
            const promt = generatePrompt.questionWithData(userMessage, groundData);

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promt }],
                model,
                temperature: GROQ_TEMPERATURE.chat,
            });

            return completion.choices[0]?.message?.content || 'No response from Groq';
        } catch (e) {
            throw assistantFailed('chat', e);
        }
    },

    // "/magic": extract a structured create/edit action from a free-text request.
    // JSON mode + low temperature keep the output a strict, parseable object.
    getGroqMagic: async (userMessage, data = {}, model = DEFAULT_MODEL) => {
        try {
            assertConfigured();
            const promt = generatePrompt.magicPrompt(userMessage, data);

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promt }],
                model,
                temperature: GROQ_TEMPERATURE.magic,
                response_format: { type: 'json_object' },
            });

            const raw = completion.choices[0]?.message?.content || '{}';
            try {
                return JSON.parse(raw);
            } catch (parseErr) {
                // Last-ditch: pull the first {...} block out of the reply.
                const match = raw.match(/\{[\s\S]*\}/);
                return match ? JSON.parse(match[0]) : { intent: 'none', reply: '' };
            }
        } catch (e) {
            throw assistantFailed('magic', e);
        }
    },

    // "/organizer": propose tags for existing events. JSON mode + low temperature
    // keep the output a strict, parseable object (same contract as getGroqMagic).
    getGroqOrganize: async (data = {}, model = DEFAULT_MODEL) => {
        try {
            assertConfigured();
            const promt = generatePrompt.organizerPrompt(data);

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promt }],
                model,
                temperature: GROQ_TEMPERATURE.organize,
                response_format: { type: 'json_object' },
            });

            const raw = completion.choices[0]?.message?.content || '{}';
            try {
                return JSON.parse(raw);
            } catch (parseErr) {
                const match = raw.match(/\{[\s\S]*\}/);
                return match ? JSON.parse(match[0]) : { actions: [], reply: '' };
            }
        } catch (e) {
            throw assistantFailed('organize', e);
        }
    },

    // Explain deterministically-detected schedule issues in friendly Ukrainian.
    // Lower temperature keeps the explanation grounded in the provided issue list.
    getGroqAnalysis: async (issues, data = {}, model = DEFAULT_MODEL) => {
        try {
            assertConfigured();
            const promt = generatePrompt.analysisPrompt(issues, data);

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promt }],
                model,
                temperature: GROQ_TEMPERATURE.analysis,
            });

            return completion.choices[0]?.message?.content || 'No response from Groq';
        } catch (e) {
            throw assistantFailed('analysis', e);
        }
    }
};
