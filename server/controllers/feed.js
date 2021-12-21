
exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{
            title: "First post",
            content: "This is the first post!"
        }]
    });
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    //create post in databse
    res.status(201).json({
        message: 'Post created successfully!',
        post: {
            id: 0,
            title: title,
            content: content
        }
    });
};