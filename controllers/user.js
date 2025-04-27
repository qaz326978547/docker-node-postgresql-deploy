const { dataSource } = require('../db/data-source')
const { isValidString, isValidPassword } = require('../utils/validUtils')
const { generateJWT } = require('../utils/jwtUtils')
const { IsNull } = require('typeorm')
const appError = require('../utils/appError')
const bcrypt = require('bcrypt')
const saltRounds = 10

const userController = {
    //取得個人詳細資料
    async getProfile (req, res, next) {
        const userRepo = dataSource.getRepository('User')
        const findUser = await userRepo.findOne({
            select: ['id', 'name', 'email', 'role'],
            where: {
                id: req.user.id
            }
        })

        res.status(200).json({
            id: findUser.id,
            name: findUser.name,
            email: findUser.email,
            role: findUser.role
        })  
        return
    },
    //使用者註冊
    async postSignup (req, res, next) {
        const { name, email, password } = req.body;
        
        if(!isValidString(name) || !isValidString(email) || !isValidString(password) ){
            next(appError(400, "欄位未填寫正確"))  
            return
        }

        if(!isValidPassword(password)){
            next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"))  
            return
        }

        const userRepo = dataSource.getRepository('User')
        const findUser = await userRepo.findOne({
            where: {
            email: email
            }
        })
        
        if(findUser){
            next(appError(409, "密碼不符合規則，Email已被使用")) 
            return
        }

        const hashPassword = await bcrypt.hash(password, saltRounds)
        const newUser = userRepo.create({
            name, email, role:'USER', password:hashPassword
        })
        const result = await userRepo.save(newUser)

        res.status(201).json({
            status: "success",
            data: {
                user: {
                    id: result.id,
                    name: result.name 
                }
            }      
        })
        return
    },
    //使用者登入
    async postLogin (req, res, next) {
        const { email, password } = req.body
        console.log(req.body)
        if(!isValidString(email) || !isValidString(password)){
            next(appError(400, "欄位未填寫正確"))
            return
        }

        if(!isValidPassword(password)){
            next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"))
            return
        }

        const userRepo = dataSource.getRepository('User')
        const findUser = await userRepo.findOne({
            select: ['id', 'name', 'password'],
            where: {
                email:email
            }
        })

        if(!findUser){
            next(appError(400, "使用者不存在或密碼輸入錯誤"))
            return
        }

        const isMatch = await bcrypt.compare(password, findUser.password)

        if(!isMatch){
            next(appError(400, "使用者不存在或密碼輸入錯誤"))
            return
        }

        //JWT
        const token = generateJWT({
            id: findUser.id
        })

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    token: token, 
                    name: findUser.name,
                }
            }
        })
        return 
    },
    //使用者更新密碼
    async putPassword (req, res, next) {
        const { id } = req.user.id
        const { password, new_password, confirm_new_password } = req.body   
        if(!isValidString(password) || !isValidString(new_password) || !isValidString(confirm_new_password)){
           next(appError(400, "'欄位未填寫正確'")) 
           return
        }   
        if(!isValidPassword(password) || !isValidPassword(new_password) || !isValidPassword(confirm_new_password)){
            next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")) 
            return
        }
        if(new_password === password){
            next(appError(400, "新密碼不能與舊密碼相同"))
            return
        }
        if(new_password !== confirm_new_password){
            next(appError(400, "新密碼與驗證新密碼不一致"))
            return
        }

        const userRepo = dataSource.getRepository('User')
        const findUser = await userRepo.findOne({
            select: ['password'],
            where: { id: id }
        })
             
        const isMatch = await bcrypt.compare(password, findUser.password)
        if(!isMatch){
            next(appError(400, "密碼輸入錯誤"))
            return
        }

        //密碼加密並更新資料
        const hashPassword = await bcrypt.hash(new_password, saltRounds)
        const updateUser = await userRepo.update({
            id: req.user.id
        },
        {
            password: hashPassword
        })

        if(updateUser.affected === 0){
            next(appError(400, "更新密碼失敗"))
            return
        }

        res.status(200).json({
            status: "success",
            data: null
        })
    },
    //更新資料
    async putProfile (req, res, next) {
        const { email } = req.body

        if(!isValidString(email)){
            next(appError(400, "欄位未填寫正確"))
            retrun
        }

        const userRepo = dataSource.getTreeRepository('User')
        const updateUser = await userRepo.update(
            { id: req.user.id },
            { email: email }
        )

        if(updateUser.affected === 0){
            next(appError(400, "更新使用者失敗"))
            return
        }
        
        res.status(200).json({
            status : "success"
        })
        return 
    }
}

module.exports = userController;