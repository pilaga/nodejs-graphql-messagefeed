const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

exports.signup = (req, res, next) => {
    //check for input errors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, signup data is incorrect');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
    .then(hashedPwd => {
        const user = new User({
            email: email,
            name: name,
            password: hashedPwd
        });
        return user.save();
    })
    .then(result => {
        res.status(201).json({
            message: 'User created',
            userId: result._id
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};