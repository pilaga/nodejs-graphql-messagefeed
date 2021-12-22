
exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{
            _id: 1,
            title: "First post",
            content: "This is the first post!",
            imageUrl: "images/walle.png",
            creator: {
                name: "Pierre"
            },
            createdAt: new Date()
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
            _id: new Date().toISOString(),
            title: title,
            content: content,
            creator: {
                name: "Pierre"
            },
            createdAt: new Date()
        }
    });


};