const Groq = require('groq-sdk');

const { GROQ_API_KEY, DEFAULT_MODEL } = require('../../config/config');
const { generatePrompt } = require('../../helper');
const ApiError = require('../../error/ErrorHandler');
<<<<<<< HEAD
const { ASSISTANT_REQUEST_FAILED } = require('../../error/errorMsg');
const { GROQ_TEMPERATURE } = require('../../constant/assistant.enum');
=======
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3

const groq = new Groq({ apiKey: GROQ_API_KEY });

module.exports = {
    getGroqResponse: async (userMessage, groundData, model = DEFAULT_MODEL) => {
        try {
            const promt = generatePrompt.questionWithData(userMessage, groundData);

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promt }],
                model,
<<<<<<< HEAD
                temperature: GROQ_TEMPERATURE.chat,
=======
                temperature: 1.4,
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
            });

            return completion.choices[0]?.message?.content || 'No response from Groq';
        } catch (e) {
<<<<<<< HEAD
            throw new ApiError(...Object.values(ASSISTANT_REQUEST_FAILED));
        }
    },

    // "/magic": extract a structured create/edit action from a free-text request.
    // JSON mode + low temperature keep the output a strict, parseable object.
    getGroqMagic: async (userMessage, data = {}, model = DEFAULT_MODEL) => {
        try {
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
            throw new ApiError(...Object.values(ASSISTANT_REQUEST_FAILED));
        }
    },

    // "/organizer": propose tags for existing events. JSON mode + low temperature
    // keep the output a strict, parseable object (same contract as getGroqMagic).
    getGroqOrganize: async (data = {}, model = DEFAULT_MODEL) => {
        try {
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
            throw new ApiError(...Object.values(ASSISTANT_REQUEST_FAILED));
=======
            throw new ApiError(403, 4032, e);
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
        }
    },

    // Explain deterministically-detected schedule issues in friendly Ukrainian.
    // Lower temperature keeps the explanation grounded in the provided issue list.
    getGroqAnalysis: async (issues, data = {}, model = DEFAULT_MODEL) => {
        try {
            const promt = generatePrompt.analysisPrompt(issues, data);

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promt }],
                model,
<<<<<<< HEAD
                temperature: GROQ_TEMPERATURE.analysis,
=======
                temperature: 0.7,
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
            });

            return completion.choices[0]?.message?.content || 'No response from Groq';
        } catch (e) {
<<<<<<< HEAD
            throw new ApiError(...Object.values(ASSISTANT_REQUEST_FAILED));
=======
            throw new ApiError(403, 4032, e);
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
        }
    }
};
