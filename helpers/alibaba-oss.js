const _ = require('lodash');
const OSS = require('ali-oss');
  
const fs = require('fs');
  

  
function AliOssClient({ bucket, region }) {
  
  if (!(this instanceof AliOssClient)) {
  
    return new AliOssClient();
  
  }
  

  
  this.client = new OSS({
	
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  
    bucket,
    region,
  
  });
  
}

  /**
	
   * List all buckets in your account.
	
   * @param {Object} [query]
	
   * @param {String} [query.prefix] - Search objects that match prefix
	
   * @param {String} [query.marker] - Search start from marker, including marker
	
   * @param {String|Number} [query['max-keys'], Maximum objects in result
	
   * @param {Object} [options] - Optional params
	
   * @param {Number} [options.timeout] - Request timeout
	
   * @return {Promise}
	
   */
	
  AliOssClient.prototype.listBuckets = async function (query, options) {
	
    const result = await this.client.listBuckets(query, options);
	
    console.log('Bucket names: ' + _.map(result.buckets, 'name'));
	
  
	
    return result;
	
  };