const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

module.exports = {
    createUser: async function({ userInput }, req) {
        //if using then/catch instead of async/await, need to return the User.findOne() result
        const validationErrors = [];
        if(!validator.isEmail(userInput.email)) {
            validationErrors.push({ message: 'Email is invalid' });
        }
        if(validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            validationErrors.push({ message: 'Password is not long enough' });
        }
        if(validationErrors.length > 0) {
            const error = new Error('Invalid input');
            error.data = validationErrors;
            error.code = 422;
            throw error;
        }
        const existingUser = await User.findOne({ email: userInput.email });
        if(existingUser) {
            const error = new Error('User exists already');
            throw error;
        }
        const hashedPwd = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email: userInput.email,
            password: hashedPwd,
            name: userInput.name
        });
        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() };
    },
    login: async function({ email, password }) {
        const user = await User.findOne({ email: email });
        if(!user) {
            const error = new Error('User not found');
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if(!isEqual) {
            const error = new Error('Password is incorrect');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 
        'my-secret-key',
        {
            expiresIn: '6h'
        });
        return { 
            token: token,
            userId: user._id.toString()
        };
    }
};