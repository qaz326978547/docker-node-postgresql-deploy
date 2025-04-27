const { dataSource } = require('../db/data-source')
const appError = require('../utils/appError')
const { verifyJWT } = require('../utils/jwtUtils')
const logger = require('../utils/logger')('isAuth')

const isAuth = async (req, res, next) => {
    try{
        // 確認 token 是否存在並取出 token
        const authHeader = req.headers.authorization
        if(!authHeader || !authHeader.startsWith('Bearer')){
            //401: 你尚未登入!
            next(appError(401, "您尚未登入!"))
            return
        }

        // 取出 token
        const token = authHeader.split(' ')[1]
        //驗證 token
        const decoded = await verifyJWT(token)
        // 尋找對應 id 的使用者
        const currentUser = await dataSource.getRepository('User').findOne({
            where: {
                id: decoded.id
            }
        })

        if(!currentUser){
            next(appError(401, '無效的 token'))
            return
        }
        req.user = currentUser

        next()
    }catch(error){
        logger.error(error.message)
        next(error)
    }
}

module.exports = isAuth