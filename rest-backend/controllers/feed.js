const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const socket = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    try {
        totalItems = await Post.find().countDocuments();
        const posts = await Post.find().populate('creator').skip((currentPage - 1) * perPage).limit(perPage);

        res.status(200).json({
            message: 'All posts fetched',
            posts: posts,
            totalItems: totalItems
        })
    }
    catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost= async (req, res, next) => {
    const id = req.params.postId;
    try {
        const post = await Post.findById(id);
        if(!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404
            throw error;
        }
        res.status(200).json({
            message: 'Post fetched',
            post: post
        });
    }
    catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    } 
}

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    //image
    if(!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path.replace("\\" ,"/");
    //create new post in database
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    try {
        await post.save();
        const user = await User.findById(req.userId)
        user.posts.push(post);
        const result = await user.save();
        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: {
                _id: user._id,
                name: user.name
            }
        });
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file) {
        imageUrl = req.file.path.replace("\\" ,"/");
    }
    if(!imageUrl) {
        const error = new Error('No image file picked');
        error.statusCode = 422;
        throw error;
    }
    //if we reached here, data is valid - update
    try {
        const post = Post.findById(postId);
        if(!post) {
            const error = new Error('Could not find post to update');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        //if image changes, delete old image
        if(imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        //update post data
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();
        res.status(200).json({
            message: 'Post updated successfully',
            post: result
        })
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        //TODO: check logged in user (need authentication)
        if(!post) {
            const error = new Error('Could not find post to update');
            error.statusCode = 404;
            throw error;
        }  
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }      
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    })
    .then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
        user.posts.pull(postId);
        return user.save();
    })
    .then(result => {
        res.status(200).json({
            message: 'Post successfully deleted'
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}

//delete image helper function
const clearImage = filepath => {
    filepath = path.join(__dirname, '..', filepath);
    fs.unlink(filepath, err => {
        if(err)
        console.log(err);
    })
}