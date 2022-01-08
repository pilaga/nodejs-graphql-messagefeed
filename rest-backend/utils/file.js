const path = require('path');
const fs = require('fs');

//delete image helper function
const clearImage = filepath => {
    filepath = path.join(__dirname, '..', filepath);
    fs.unlink(filepath, err => {
        if(err)
        console.log(err);
    })
}

exports.clearImage = clearImage;