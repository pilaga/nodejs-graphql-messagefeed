const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const MONGODB_TEST_URI = 'mongodb+srv://admin:password_02@cluster0.lrvxm.mongodb.net/test-messages?retryWrites=true&w=majority';

const feedController = require('../controllers/feed');
const User = require('../models/user');
const Post = require('../models/post');

describe('Feed controller', function(done) {

    //runs before we start testing
    before(function(done) {
        mongoose.connect(MONGODB_TEST_URI)
        .then(result => {
            //set up a dummy user
            const user = new User({
                email: 'test@test.com',
                password: 'test',
                name: 'test',
                posts: [],
                _id: '5c0f66b979af55031b34728a' //manually set up so we can find the user, needs to be a valid ID string
            });
            return user.save();
        })
        .then(() => {
            done();
        })
    });

    it('should add a created post to creator\'s post collection', function(done){

        const req = {
            //dummy post
            body: {
                title: 'test post',
                content: 'a test post content'
            },
            file: {
                path: 'test path'
            },
            userId: '5c0f66b979af55031b34728a'
        };

        const res = {
            status: function() {
                return this;
            },
            json: function() {}
        };

        feedController.createPost(req, res, () => {}).then(savedUser => {
            expect(savedUser).to.have.property('posts');
            expect(savedUser.posts).to.have.length(1);
            done(); //signal to mocha that we waited/executed async code
        })
    });

    after(function(done){
        User.deleteMany({})
        .then(() => {
            //delete all users
            return mongoose.disconnect()
        }) 
        .then(() => {
            done();
        });
    });
});