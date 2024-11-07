const  { body, validationResult } = require('express-validator');

const validate = (req, res,next) => {
    body('email').isEmail(),
    body('password').isLength({
        min: 6
    })

    const errors = validationResult(req);
    // if(error.length > 0) {
    //     return {
    //         error: errors.array()
    //     }
    // }
    console.log(errors.array())
    return next();
}

module.exports = {
    validate
}