const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');

const MONGODB_URI = 'mongodb+srv://admin:password_02@cluster0.lrvxm.mongodb.net/messages?retryWrites=true&w=majority';

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

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(8080);
})
.catch(err => console.log(err));