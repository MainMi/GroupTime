const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const { PORT } = require('./config/config');

const app = require('./app');
const { reminderService } = require('./service');

app.listen(PORT, () => {
    console.log(`Server running. Use our API on port: ${PORT}`);
});

// Start the reminder scheduler (no-op under tests). A failure here must not take
// the API down — reminders are best-effort.
reminderService.init().catch((e) => console.error('Reminder scheduler failed to start:', e.message));
