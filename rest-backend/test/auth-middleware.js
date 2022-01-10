const expect = require('chai').expect;
const authMiddleware = require('../middleware/is-auth');

it('should throw an error if no authorization header', function(){
    const req = {
        get: function() {
            return null; //doesn't return authentication header
        }
    };
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw(
        'Not authenticated!'
        );

})