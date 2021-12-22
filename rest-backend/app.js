const express = require('express');
const bodyparser = require('body-parser');

const feedRoutes = require('./routes/feed');

const app = express();

app.use(bodyparser.json());

//add headers on any incoming response to allow cross origin requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/feed', feedRoutes);

app.listen(8080);