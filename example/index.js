const upFtp = require('../index');

class Api {
    registerCommand = (type, callback) => {
        if ('ftpdeploy' === type) callback();
    }
}
class Options {
    pluginOptions = {
        ftp: {
            host: "",
            remoteFtpPath: '',
            delArr: []
        }
    }
    constructor(host, remoteFtpPath, delArr) {
        this.pluginOptions.ftp.host = host;
        this.pluginOptions.ftp.remoteFtpPath = remoteFtpPath;
        this.pluginOptions.ftp.delArr = delArr
    }
}

const api = new Api();
const options = new Options("192.168.1.101", "/newf/", ['测试']);
upFtp(api, options);