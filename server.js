const express = require('express')
const app = express()
var cors = require('cors')
const dbConfig = require('./src/config/config.js')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const userRouter = require('./src/routes/user')
const ossRouter = require('./src/routes/oss_upload')
global.__basedir = __dirname;


mongoose.Promise = global.Promise

mongoose.connect("mongodb://admin:admin123@ds147592.mlab.com:47592/kantor-hosting",{useNewUrlParser:true, useUnifiedTopology:true})
    .then(()=>{
        console.log('success connect db')
    }).catch(err=>{
        console.log(err)
        process.exit()
    })


app.use(cors())
app.use(bodyParser.json({limit:'50mb'}))
app.use(bodyParser.urlencoded({extended:true,limit:'50mb'}))


app.use(express.json())
app.use(userRouter)
app.use(ossRouter)



app.listen(5000,function(){
    console.log('listening on 5000')
})