/**
 * @file 阿里OSS服务上传工具
 */

const OSS = require('ali-oss')
const path = require('path')
const Log = require('./../../lib/log')('ali_utils')
const dateUtils = require('./date_utils')
const ossConfig = require('./../../config').oss

class AliOssUtils {
  constructor() {
    //配置信息
    this.config = {
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      allowedExtname: ['jpg', 'jpeg', 'gif', 'bmp']
    }
    this.client = new OSS(this.config)
  }

  /**
   * 上传文件
   * @param {string} file 
   */
  async upload(file) {
    try {
      // let extname = path.extname(file);
      let uploadPath = 'uploads/images/' + dateUtils.dateFormat(null, 'YYYYMMDD/')
      let localFilename = path.basename(file)
      let uploadFileName = localFilename
      Log.info('upload uploadFileName:', uploadFileName)
      let result = await this.client.put(uploadPath + uploadFileName, file);
      Log.info('upload result:', uploadFileName)
      return result
    } catch (err) {
      Log.error('upload err:', err)
      return false
    }
  }


  async listBuckets() {
    try {
      return await this.client.listBuckets();
    } catch (err) {
      return err.message
    }
  }
}

module.exports = new AliOssUtils()