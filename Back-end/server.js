const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const { PORT } = require('./config/config');

const app = require('./app');

app.listen(PORT, () => {
    console.log(`Server running. Use our API on port: ${PORT}`);
});
