const express = require('express');
const path = require('path');
const app = express();

app.set('views', path.join( __dirname, 'views'));
app.set('view engine', 'ejs');  

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});