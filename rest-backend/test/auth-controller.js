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
                posts: [],
                _id: '5c0f66b979af55031b34728a' //manually set up so we can find the user, needs to be a valid ID string
            });
            return user.save();
        })
        .then(() => {
            const req = { userId: '5c0f66b979af55031b34728a' };
            const res = {
                statusCode: 500,
                userStatus: null,
                status: function(code){
                    this.statusCode = code;
                    return this;
                },
                json: function(data){
                    this.userStatus = data.status;
                }
            };
            authController.getUserStatus(req, res, () => {})
            .then(() => {
                expect(res.statusCode).to.be.equal(200);
                expect(res.userStatus).to.be.equal('I am new!');
                done();
            });
        })
        .catch(err => console.log(err));
    };
});