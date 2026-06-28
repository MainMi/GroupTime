// AI-assistant slash commands and tuning. Kept in one place so the command
// strings aren't repeated across the menu, the input matcher and the handlers.
export const ASSISTANT_COMMANDS = {
    MAGIC: '/magic',
    ORGANIZER: '/organizer',
    ANALYZE: '/analyze',
};

// How many recent messages are sent to the backend as chat context.
export const ASSISTANT_HISTORY_LIMIT = 10;
