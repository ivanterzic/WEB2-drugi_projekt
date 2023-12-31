import { csrfRoutes } from "./routes/csrf.routes";
const express = require('express');
const path = require('path');
import {sqlRoutes} from './routes/sql.routes';
import {safeCsrfRoutes} from './routes/safecsrf.routes';
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/csrf', csrfRoutes);
app.use('/sql', sqlRoutes);
app.use('/safecsrf', safeCsrfRoutes);

app.get('/', (req, res) => {
    res.render('index');
});



app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});