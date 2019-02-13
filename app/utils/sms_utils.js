const https = require('https');
const qs = require('querystring');
const apikey = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

class SmsUtils{

  sendVerifyCodeSms(mobile,code){
    let post_data = {  
    'apikey': apikey,  
    'mobile':mobile,
    'text':`您的验证码是:${code}`,
    };//这是需要提交的数据  
    let content = qs.stringify(post_data);  
    this.post('/v2/sms/single_send.json',content,'sms.yunpian.com');
  }

  query_user_info(){
    let post_data = {  
    'apikey': apikey,  
    };//这是需要提交的数据
    let content = qs.stringify(post_data);  
    this.post('/v2/user/get.json',content,'sms.yunpian.com');
  }

  post(uri,content,host){
    var options = {  
        hostname: host,
        port: 443,  
        path: uri,  
        method: 'POST',  
        headers: {  
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'  
        }  
    };
    var req = https.request(options, function (res) {  
        // console.log('STATUS: ' + res.statusCode);  
        // console.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');  
        res.on('data', function (chunk) {  
            console.log('BODY: ' + chunk);  
        });  
    }); 
    //console.log(content);
    req.write(content);  

    req.end();   
  }
}

module.exports = new SmsUtils();
