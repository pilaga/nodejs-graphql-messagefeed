const expect = require('chai').expect;
const sinon = require('sinon');

const authController = require('../controllers/auth');
const User = require('../models/user');

describe('Auth controller - Login', function() {
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

        //expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('Not authenticated!');
    });
});