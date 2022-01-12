const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const MONGODB_TEST_URI = 'mongodb+srv://admin:password_02@cluster0.lrvxm.mongodb.net/test-messages?retryWrites=true&w=majority';

const authController = require('../controllers/auth');
const User = require('../models/user');

describe('Auth controller - Login', function(done) {
    it('should throw error if accessing the database fails', function(done){
        //stubbing findOne to fake database access
        sinon.stub(User, 'findOne');
        User.findOne.throws();
        const req = {
            body: {
                email: 'test@test.com',
                password: 'test'
            }
        };
        authController.login(req, {}, () => {}).then(result => {
            expect(result).to.be.an('error');
            expect(result).to.have.property('statusCode', 500);
            done(); //signal to mocha that we waited/executed async code
        })
        User.findOne.restore();
    });

    it('should send a response with a valid user status for an existing user'), function(done){
        mongoose.connect(MONGODB_TEST_URI)
        .then(result => {
            const user = new User({
                email: 'test@test.com',
                password: 'test',
                name: 'test',
                posts: []
            });
            return user.save();
        })
        .then(user => {
            
        })
        .catch(err => console.log(err));
    };
});