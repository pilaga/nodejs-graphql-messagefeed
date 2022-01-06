const bcrypt = require('bcryptjs');
const validator = require('validator');

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
    }
}