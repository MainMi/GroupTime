const Groq = require('groq-sdk');

const { GROQ_API_KEY, DEFAULT_MODEL } = require('../../config/config');
const { generatePrompt } = require('../../helper');
const ApiError = require('../../error/ErrorHandler');

const groq = new Groq({ apiKey: GROQ_API_KEY });

module.exports = {
    getGroqResponse: async (userMessage, groundData, model = DEFAULT_MODEL) => {
        try {
            const promt = generatePrompt.questionWithData(userMessage, groundData);

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promt }],
                model,
                temperature: 1.4,
            });

            return completion.choices[0]?.message?.content || 'No response from Groq';
        } catch (e) {
            throw new ApiError(403, 4032, e);
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
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content || 'No response from Groq';
        } catch (e) {
            throw new ApiError(403, 4032, e);
        }
    }
};
