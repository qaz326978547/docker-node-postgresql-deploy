const appError = require('../utils/appError')

module.exports = (req, res, next) => {
    if(!req.user || req.user.role !== 'TEACHER'){
        next(appError(401, '使用者尚未成為老師'))
        return
    }
    next()
}