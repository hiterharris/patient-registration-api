const app = require('./api/server');
require('dotenv').config();

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server listening on port ${port}`));