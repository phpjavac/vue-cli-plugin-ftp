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
            deleteWhite: undefined, // 删除白名单
            uploadWhite: [] // 上传白名单
        }
    }
    constructor(host, remoteFtpPath, deleteWhite, uploadWhite) {
        this.pluginOptions.ftp.host = host;
        this.pluginOptions.ftp.remoteFtpPath = remoteFtpPath;
        this.pluginOptions.ftp.deleteWhite = deleteWhite;
        this.pluginOptions.ftp.uploadWhite = uploadWhite;
    }
}

const api = new Api();
const options = new Options("192.168.1.101", "/newf/", ['META-INF', 'upload', 'WEB-INF'], ['static/installer/demo.exe']);
upFtp(api, options);