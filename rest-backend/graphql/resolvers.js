const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const { clearImage } = require('../utils/file');

const User = require('../models/user');
const Post = require('../models/post');

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
            const error = new Error('Invalid user input');
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
    },
    createPost: async function({ postInput }, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const validationErrors = [];
        if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            validationErrors.push({ message: "Title is invalid" });
        }
        if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            validationErrors.push({ message: "Content is invalid" });
        }
        if(validationErrors.length > 0) {
            const error = new Error('Invalid post input');
            error.data = validationErrors;
            error.code = 422;
            throw error;
        }
        //input is valid, find user and create new post
        const user = await User.findById(req.userId);
        if(!user) {
            const error = new Error('Invalid user/authentication');
            error.code = 401;
            throw error;
        }
        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        });
        const createdPost = await post.save();
        //add post to user's post
        user.posts.push(createdPost);
        await user.save();
        //returning result to front end
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        };
    },
    posts: async function({ page }, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        if(!page) {
            page = 1;
        }
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page -1)* perPage)
            .limit(perPage)
            .populate('creator');
        return {
            posts: posts.map(p => {
                return { 
                    ...p._doc, 
                    _id: p._id.toString(), 
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                };
            }),
            totalPosts: totalPosts
        };
    },
    post: async function({ id }, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate('creator');
        if(!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        };
    },
    updatePost: async function({ id, postInput }, req) {
        //check everything is okay
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate('creator');
        if(!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        if(post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Post update not authorised');
            error.code = 403;
            throw error;
        }
        //validate input
        const validationErrors = [];
        if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            validationErrors.push({ message: "Title is invalid" });
        }
        if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            validationErrors.push({ message: "Content is invalid" });
        }
        if(validationErrors.length > 0) {
            const error = new Error('Invalid post input');
            error.data = validationErrors;
            error.code = 422;
            throw error;
        }
        //from here we know input is valid
        post.title = postInput.title;
        post.content = postInput.content;
        if(postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl;
        }
        const updatedPost = await post.save();
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },
    deletePost: async function({ id }, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        //check that post belongs to user
        const post = await Post.findById(id);
        if(!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId.toString()) {
            const error = new Error('Post delete not authorised');
            error.code = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(id);
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();
        return true;
    },
    user: async function(args, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if(!user) {
            const error = new Error('No user found');
            error.code = 404;
            throw error;
        }
        return {
            ...user._doc,
            _id: user._id.toString()
        }
    },
    updateStatus: async function({ status }, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if(!user) {
            const error = new Error('No user found');
            error.code = 404;
            throw error;
        }
        user.status = status;
        await user.save();
        return {
            ...user._doc,
            _id: user._id.toString()
        } 
    }
};