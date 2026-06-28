// Numeric tuning for the AI assistant (the localized *text* lives in
// assistantText.js / promptText.js). Kept here so the model sampling params
// aren't magic numbers buried in groq.service.
module.exports = {
    // Sampling temperature per assistant feature. Chat is intentionally chattier
    // (higher); the structured/JSON features stay low for parseable, grounded output.
    GROQ_TEMPERATURE: {
        chat: 1.4,
        magic: 0.2,
        organize: 0.3,
        analysis: 0.7,
    },
};
