const User = require('../models/user');
const bcrypt = require('bcryptjs');


module.exports = {
    createUser: async function({ userInput }, req) {
        //if using then/catch instead of async/await, need to return the User.findOne() result
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