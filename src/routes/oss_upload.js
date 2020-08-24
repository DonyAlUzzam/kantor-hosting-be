const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const util = require("util");
const config = require('../config/config')
require('dotenv').config();
const ObjectId = require('mongodb').ObjectID
let co = require('co');
const fs = require('fs')
let OSS = require('ali-oss');
const Bucket = require('../models/oss_upload')
const auth = require('../middleware/auth')
const multer = require("multer");

let client = new OSS({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    region: process.env.ALIBABA_CLOUD_REGION
  });

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, "./uploads/");
    },
    filename: function (req, file, cb) {
        var fileObj = {
          "image/png": ".png",
          "image/jpeg": ".jpeg",
          "image/jpg": ".jpg",
          "audio/mpeg": ".mpeg",
          "text/csv": ".csv",
        };
        if (fileObj[file.mimetype] == undefined) {
          cb(new Error("file format not valid"));
        } else {
          cb(null, file.fieldname + "-" + new Date().toISOString() + fileObj[file.mimetype]);
        }
      },
  });
  
// const imageFilter = (req, file, cb) => {
//     if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "text/csv") {
//       cb(null, true);
//     } else {
//       cb(null, false);
//     }
//   };

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    //fileFilter: imageFilter,
});

const uploadAsync = util.promisify(upload.single("file"));

router.post('/oss/create-bucket', auth.auth, async(req,res)=>{
    try {
        const result = await client.getBucketInfo(req.body.bucket_name)
        res.status(400).send("Bucket Name already exist!")
      } catch (error) {
        // The specified bucket does not exist.
        if (error.name === 'NoSuchBucketError') {
            const bucket = new Bucket({
                ...req.body,
                owner: req.user._id});
            await bucket.save()

            const result = await client.putBucket(req.body.bucket_name);
            res.status(201).send({
                success: true,
                message: "Your Bucket has been Created!",
                file: result
            })
        } else {
            res.status(400).send("Something Wrong!")
        }
      }
})

router.post('/oss/upload', auth.auth, uploadAsync, async(req,res)=>{
    // client.useBucket('try-kantor-hosting');
    try{
        const data = await Bucket.findOne({owner: req.user._id})
        const bucketName = data.bucket_name
        client.useBucket(bucketName);
        const result = await client.put(req.file.filename, __basedir+'/uploads/'+req.file.filename);
        res.status(201).send({
            success: true,
            message: "File Has Been Uploaded!",
            file: result
        })
        fs.unlink(__basedir+'/uploads/'+req.file.filename, function(err) {
            if(err && err.code == 'ENOENT') {
                // file doens't exist
                console.info("File doesn't exist, won't remove it.");
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error("Error occurred while trying to remove file");
            } else {
                console.info(`removed`);
            }
        });

    }catch(e){
        if (e.code === 'ConnectionTimeoutError') {
            res.status(400).send("TimeoutError")
          }
        res.status(400).send(e)
    }
})

router.get('/oss', auth.auth, async(req,res)=>{
    // client.useBucket('try-kantor-hosting');
    try {
        const data = await Bucket.findOne({owner: req.user._id})
        const bucketName = data.bucket_name
        client.useBucket(bucketName);
        console.log(bucketName)
        let file = await client.list();
        res.send({status: true, "data": file.objects})

      } catch (e) {
        console.log(e);
      }
})


router.get('/oss/:id', auth.auth, async(req,res)=>{
    try{
        const data = await Bucket.findOne({owner: req.user._id})
        const bucketName = data.bucket_name
        client.useBucket(bucketName);
        
        try{
            let file = await client.get(req.params.id, req.params.id);
            res.send({status: true, file})
        }catch(e){
            if (e.name === 'NoSuchKeyError') {
                res.status(404).send({
                    success: false,
                    message: "Your File not Found!",
                })
            } else {
                res.status(400).send("Something Wrong!")
            }
        }
    }catch(error){
        console.log(error,'error')
        res.status(400).send(error)
    }
})


router.delete('/oss/:id', auth.auth, async(req,res)=>{
    try{
        const data = await Bucket.findOne({owner: req.user._id})
        const bucketName = data.bucket_name
        client.useBucket(bucketName);
        
        let file = await client.delete(req.params.id, req.params.id);
        res.send({status: true, message:"Your file has been Deleted"})

    }catch(error){
        console.log(error,'error')
        res.status(400).send(error)
    }
})

const progress = (p, _checkpoint) => {
    console.log(p); // The upload progress of the object.
    console.log(_checkpoint); // The checkpoint information of the multipart upload task.
  };

router.post('/oss/try', uploadAsync, async(req,res)=>{
    client.useBucket('kh-dev22');
    let checkpoint;
    console.log(req.file)
    for (let i = 0; i < 5; i++) {
        try {
          const result = await client.multipartUpload(req.file.filename, req.file.path, {
            checkpoint,
            async progress(percentage, cpt) {
              checkpoint = cpt;
              console.log(percentage)
            },
          });
          console.log(result);
          break; // break if success
        } catch (e) {
          console.log(e);
        }
      }
})


module.exports = router
 