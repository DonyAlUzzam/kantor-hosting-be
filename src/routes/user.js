const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const randomstring = require("randomstring")
const config = require('../config/config')
const nodemailer = require('nodemailer')
const ObjectId = require('mongodb').ObjectID

router.post('/user/register',async(req,res)=>{

    if(!req.body){
        return res.status(400).send('Request Body is Empty')
    }

    User.findOne({
        email:req.body.email
    }).then(doc=>{
        if(doc){

            res.status(500).send({
                token:"",
                message:`The email address ${doc.email} is already in use`
            })
        }else{
            try{
                const user = new User({
                    ...req.body
                })
                console.log(user,'user1')

                bcrypt.genSalt(10,(err,salt)=>{
                    bcrypt.hash(user.password,salt,async(err,hash)=>{
                        if(err) throw err

                        user.password = hash
                        const secretToken = await randomstring.generate()
                        user.secretToken = secretToken

                        const token = await user.generateAuthToken()
                        console.log(token,'sc')

                        

                        user.save().then(account=>{
                            const transporter = nodemailer.createTransport({
                                service:"gmail",
                                // host:"smtp.kantorhosting.com",
                                // port:587,
                                secure:true,
                                auth:{
                                    user:"hostingkantor@gmail.com",
                                    pass:"KantorHosting123"
                                }
                            })

                            const url = `${config.url_application}/auth/verification/${secretToken}`
                            const mailOptions = {
                                from:config.email,
                                to:user.email,
                                subject:"Verification New Account",
                                html:`<a href="${url}">Click to Verification your email</a>`
                            }

                            transporter.sendMail(mailOptions,(error,info)=>{
                                if(error){
                                    console.log(error)
                                }else{
                                    console.log(info)
                                }   
                            })

                            res.status(201).send({user,token})
                        })
                    })
                })
            }catch(e){
                res.status(400).send(e)
            }
        }
    })
})

router.post('/user/login',async(req,res)=>{
    console.log(req.body,'hallo')
    try{
        const{email,password} = req.body
        const user = await User.findByCredentials(email,password)
        if(typeof user.success !== 'undefined' && user.success == false){
            console.log(user,'user')

            return res.status(401).send(user)
        }

        res.send({success:true,user})

    }catch(error){
        console.log(error,'errie')
        res.status(400).send(error)
    }
})

router.post('/user/verification/:secretToken',async(req,res)=>{
    console.log(req.params.secretToken,'doc')

    User.findOne({
        "secretToken":req.params.secretToken
    }).then( async doc=>{
        if(doc==null){
            res.status(400).send({
                "success":false,
                "message":"invalid token"
            })
        }else{
            if(doc.isVerify){
                res.status(400).send({
                    "success":false,
                    "message":"Your email has been Verify, Please Login"
                })
            }else{
                const update = await User.findOneAndUpdate({"_id":ObjectId(doc._id)},{isVerify:true,secretToken:''})

                const user = await User.findOne({"_id":ObjectId(doc._id)})

                res.status(200).send({
                    success:true,
                    message:"Please Login",
                    data:user
                })

            }
        }

    })
})

module.exports = router
 