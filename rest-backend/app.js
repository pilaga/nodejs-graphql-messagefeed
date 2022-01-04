const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const MONGODB_URI = 'mongodb+srv://admin:password_02@cluster0.lrvxm.mongodb.net/messages?retryWrites=true&w=majority';

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
})

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

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
    const server = app.listen(8080);
    //set up socket.io
    const io = require('./socket').init(server);
    io.on('connection', (stream) => {
        console.log('Client connected');
    });
})
.catch(err => console.log(err));