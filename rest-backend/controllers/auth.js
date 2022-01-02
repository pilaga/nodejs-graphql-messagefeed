const User = require('../models/user');
const { validationResult } = require('express-validator');

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
    const name = req.body.mail;
    const password = req.body.password;
};