import { csrfRoutes } from "./routes/csrf.routes";
const express = require('express');
const path = require('path');
import {sqlRoutes} from './routes/sql.routes';

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 5000;

app.use('/csrf', csrfRoutes);
app.use('/sql', sqlRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});