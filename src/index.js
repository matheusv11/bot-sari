const express = require('express');
const app = express();
const cors = require('cors')
const port = process.env.PORT || 3030; // Usar .env local
const routes = require('./routes');

app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(port, () => console.log(`Backend Running on Port ${port}`));

module.exports = app;