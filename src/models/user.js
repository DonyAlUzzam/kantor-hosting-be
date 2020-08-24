const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../config/config')

const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            trim:true
        },
        password:{
            type:String,
            required:true,
            minlength:6,
            trim:true
        },
        token:{
            type:String,
            required:true
        },
        secretToken:{
            type:String,
            required:true
        },
        isVerify:{
            type:Boolean,
            default:false
        }
    }
)

userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user._id.toString()},config.jwt_key)

    user.token = token

    await user.save()

    return token
}



userSchema.statics.findByCredentials = async (email,password)=>{

    const user = await User.findOne({email})

    if(!user){
        const result = {
            success:false,
            message:'Invalid Login'
        }

        return result
    }
    
    
    const isPasswordMatch = await bcrypt.compare(password,user.password)
    
    if(!user.isVerify){
        const result = {
            success:false,
            message:'Please check your email to Verification your account'
        }

        return result
    }else if(!isPasswordMatch){
        const result = {
            success:false,
            message:'Username and Password Wrong , Please Login Again'
        }

        return result
    }else{
        return user
    }   

    

    
}


const User = mongoose.model('User',userSchema)
module.exports = User