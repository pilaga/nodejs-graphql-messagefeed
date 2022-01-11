const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/is-auth');

describe('Auth middleware', function() {
    it('should throw error if no authorization header', function(){
        const req = {
            get: function() {
                return null; //doesn't return authentication header
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('Not authenticated!');
    });
    
    it('shoud throw error if authorization header is only one string', function(){
        const req = {
            get: function() {
                return 'xxx'; //only returns 1 string
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    });

    it('should throw error if the token cannot be verified', function(){
        const req = {
            get: function() {
                return 'Bearer xyz'; //only returns 1 string
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    });

    it('should yield a userId after decoding the token', function(){
        const req = {
            get: function() {
                return 'Bearer xyz'; //only returns 1 string
            }
        };
        //creating stub function to override jwt.verify() function
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ userId: 'abc' });
        authMiddleware(req, {}, () => {});
        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 'abc');
        expect(jwt.verify.called).to.be.true;
        //restoring original jwt.verify function
        jwt.verify.restore();
    });
});

