const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('../config/config')

const auth = async(req,res,next)=>{
    const token = req.header('Authorization').replace('Bearer ','')
    const data = jwt.verify(token,config.jwt_key)

    try{
        const user = await User.findOne({_id:data._id,token:token})
        if(!user){
            throw new Error('user not found')
        }

        req.user = user
        req.token = token

        next()

    }catch(error){
        res.status(401).send({error:'Not authorized to access this resource'})
    }
}

module.exports = {auth}