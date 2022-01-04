const MONGODB_URI = 'mongodb+srv://admin:password_02@cluster0.lrvxm.mongodb.net/messages?retryWrites=true&w=majority';

const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const app = express();

//configure multer
const { v4: uuidv4 } = require('uuid');
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4());
    }
});
const fileFilter = (req, file, cb) => {
    if( file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg')
    {
        cb(null, true);
    }
    else
    {
        cb(null, false);
    }
}

app.use(bodyparser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

//add headers on any incoming response to allow cross origin requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver
}));

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ 
        message: message,
        data: data 
    });
});

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(8080);
})
.catch(err => console.log(err));