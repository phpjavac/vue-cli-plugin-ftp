
const Client = require("ftp");
const fs = require("fs");
const ProgressBar = require("./src/progress_bar");
module.exports = (api, projectOptions) => {
    api.registerCommand('ftpdeploy', () => {

        if (!projectOptions.pluginOptions || !projectOptions.pluginOptions.ftp) {
            console.log("未设置ftp配置")
            return;
        }
        if (!projectOptions.pluginOptions.ftp.host || !projectOptions.pluginOptions.ftp.remoteFtpPath) {
            console.log("未设置ftp地址或项目路径")
            return;
        }
        // ...
        // const ora = require("ora");
        const ftp = new Client();
        const connectionProperties = {
            host: projectOptions.pluginOptions.ftp.host
        };
        const remoteFtpPath = projectOptions.pluginOptions.ftp.remoteFtpPath;
        const dirPath = `${process.cwd()}/dist/`;
        // const spinner = ora("正在和服务器同步")
        // eslint-disable-next-line no-unused-vars
        let pb = null;
        const ACTIONS = []
        /** 递归写入文件 */
        function readFiles(filepath) {
            return new Promise((res, rej) => {
                const actions = [];
                const actions1 = [];
                const fileList = [];
    
                fs.readdir(filepath, { withFileTypes: true }, (err, files) => {
                    if (err) rej(err);
                    if (files.length > 0) {
                        for (let index = 0; index < files.length; index++) {
                            const file1 = files[index];
                            const action = () => { // 将每一次循环方法定义为一个方法变量
                                return new Promise(resolve => { // 每个方法返回一个Promise对象，第一个参数为resolve方法
                                    ((file) => {
                                        if (file.isFile()) { // 文件
                                            // eslint-disable-next-line camelcase
                                            const child_filepath = `${filepath}${file.name}`;
                                            fs.readFile(child_filepath, (err1, data) => {
                                                if (err1) throw err1;
                                                const dir = remoteFtpPath + filepath.replace(dirPath, "").replace("\\", "/");
                                                const data1 = {
                                                    dir,
                                                    dirName: `${dir}/${file.name}`,
                                                    data
                                                };
                                                fileList.push(data1);
                                                resolve();
                                            });
                                        } else {
                                            // 目录
                                            const child_filepath = `${filepath}${file.name}/`;
                                            readFiles(child_filepath)
                                            resolve();
                                        }
                                    })(file1);
                                });
                            };
                            actions.push(action());
                        }
                        Promise.all(actions).then(() => { // 调用Promise的all方法，传入方法数组，结束后执行then方法参数中的方法
                            for (let index = 0; index < fileList.length; index++) {
                                const action = () => {
                                    return new Promise(resolve => {
                                        const element = fileList[index];

                                        ftp.mkdir(element.dir, false, (() => {
                                            ftp.put(element.data, element.dirName, (err2) => {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                ftp.end();
                                                pb.render({ completed: index, total: fileList.length });
                                                resolve();
                                            });
                                        }));
                                    })
                                }
                                actions1.push(action());
                            }
                            Promise.all(actions1).then(() => {
                                pb.render({ completed: fileList.length, total: fileList.length });
                                res('更新成功')
                                console.log(`${filepath}更新成功`);
                            })
                        });
                    }
                });
            });
        }
        // 递归读取文件
        ftp.connect(connectionProperties);

        ftp.on("ready", () => {

            fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
                console.log("正在和服务器同步");
                pb = new ProgressBar("正在上传...", 0);
                readFiles(dirPath)

            })
        });


    })
}