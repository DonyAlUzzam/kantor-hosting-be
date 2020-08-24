const mongoose = require("mongoose");
let Schema = mongoose.Schema;

const bucketSchema = new Schema(
  {
    bucket_name: {
      required: true,
      type: String
    },
    owner: {
      required: true,
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
  },
  {
    timestamps: true
  }
);

const Bucket = mongoose.model("Bucket_user", bucketSchema);

module.exports = Bucket;
