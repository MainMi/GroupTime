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

    // A single Groq request is capped at the tier's tokens-per-minute limit
    // (8000 on the free tier), so the prompt is budgeted in characters — Cyrillic
    // costs roughly one token per two characters. The client also trims history,
    // but the budget is enforced server-side because the server builds the prompt:
    // one /analyze reply is a markdown table of ~7000 characters on its own, and a
    // handful of them in the history is enough to make every request unanswerable.
    PROMPT_BUDGET: {
        scheduleChars: 6000,
        historyChars: 4000,
        historyMessages: 10,
        // Per message, so one oversized reply cannot consume the whole history budget.
        historyMessageChars: 800,
    },
};
