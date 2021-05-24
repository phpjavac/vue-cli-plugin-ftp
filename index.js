
const Client = require("ftp");
const fs = require("fs");
const ProgressBar = require("./src/progress_bar");
const { rejects } = require("assert");
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
        if (!projectOptions.pluginOptions.ftp.delArr) {
            console.log("未设置删除文件夹");
        }
        // ...
        // const ora = require("ora");
        const ftp = new Client();
        const connectionProperties = {
            host: projectOptions.pluginOptions.ftp.host // '192.168.1.101' // 
        };
        const DelArrPath = projectOptions.pluginOptions.ftp.delArr || false;
        const remoteFtpPath = projectOptions.pluginOptions.ftp.remoteFtpPath // '/F/ftpserve-home' // 
        const dirPath = `${process.cwd()}/dist/`;
        // const spinner = ora("正在和服务器同步")
        // eslint-disable-next-line no-unused-vars
        let pb = null;
        let db = null;
        const ACTIONS = []
        /** 递归写入文件 */
        function readFiles(filepath) {
            return new Promise((res, rej) => {
                const actions = [];
                const actions1 = [];
                const fileList = [];
                console.log(2222);
                
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
                                            // resolve();
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
                                        ftp.mkdir(element.dir, true, (() => {
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

        // const deleteDir = (DirPath) => {
        //     return new Promise((res, rej) => {
        //         const actions = []
        //         for (let index = 0; index < DirPath.length; index++) {
        //             actions.push(new Promise((resolve, reject) => {
        //                 ftp.rmdir(DirPath[index], true, (err) => {
        //                     console.log(err);
        //                 })
        //                 resolve()
        //             }))
        //         }
        //         Promise.all(actions).then(resolve => {
        //             db.render({completed: DirPath.length, total: DirPath.length})
        //             res('删除完成')
        //             console.log('删除完成');
        //         })
                
        //     })
        // }
        /** 删除文件 */
        const deleteFiles = (filePath)=> {

            return new Promise((res, rej) => {
                const actions = []; // 读取server文件action
                const fileList = []; // 需要处理的files
                const actionDel = []; // 执行操作action
                console.log(1111);
                ftp.list(filePath, (err, files) => {
                    if (err) rej(err);
                    if ( files && files.length > 0) {
                        for (let i=0; i<files.length; i++) {
                            const fileIndex = files[i];
                            const action = () => {
                                return new Promise(resolve => {
                                    ( (file) => {
                                        if (file.type === '-' || file.type === 'l') {
                                            // this is file
                                            const delPath = `${filePath}/${file.name}`
                                            fileList.push({...file, delPath})
                                            resolve()
                                        } else if (file.type === 'd') {
                                            // this is directory
                                            const delPath = `${filePath}/${file.name}`
                                            deleteFiles(delPath)
                                            // resolve()
                                        }
                                    })(fileIndex)
                                })
                            }
                            actions.push(action())
                        }
                        // 或得到了所有要删除的文件，开始删除
                        Promise.all(actions).then(()=>{
                            for(let i=0; i<fileList.length; i++) {
                                const actionD = () => {
                                    return new Promise(resolve => {
                                        const f = fileList[i];
                                        ftp.delete(f.delPath, (de)=>{
                                            if (de) console.log(de)
                                        })
                                        ftp.end();
                                        db.render({completed: i, total: fileList.length})
                                        resolve()
                                    })
                                }
                                actionDel.push(actionD())
                            }
                            Promise.all(actionDel).then(()=>{
                                db.render({completed: fileList.length, total: fileList.length})
                                res(`${filePath}删除完了`)
                                console.log(`--${filePath}删除完毕`);
                            })
                        })
                    } else {
                        // ftp.end()
                        res(`${filePath}无内容`)
                    }
                })
                
            })
        }
        /** 清空文件(夹) */
        function removeFile(removePath, removeArr = ['js', 'css']) {
            return new Promise( (res, rej) => {
                const actionList = []
                
                let arr = [];
                ftp.list(removePath, (rErr, rList)=>{
                    if (rErr) rej(err);
                    if (rList && rList.length > 0) {
                        arr = rList.filter(rf=>{
                            return removeArr.includes(rf.name) && rf.type === 'd'
                        }).map(rm=>{
                            return rm.name
                        })
                        if (arr && arr.length > 0) {
                            for (let i=0; i<arr.length; i++) {
                                const path = `${remoteFtpPath}${arr[i]}`
                                actionList.push(deleteFiles(path))
                            }
                        } else {
                            rej('请检测参数')
                        }
                        // console.log(actionList, 'actionList');
                        Promise.all(actionList).then(()=>{
                            console.log('文件删除完毕，开始上传...')
                            res('删除完毕')
                        }).catch(err=>{
                            console.log('this is removeFile catch————————\n',err)
                            rej(err)
                        })
                    } else {
                        res('无匹配文件夹')
                    }
                })
                
            })
        }


        // ftp.connect(connectionProperties)

        // ftp.on("ready",async () => {
        //     try {
        //         if (DelArrPath) {
        //             db = new ProgressBar('正在删除...', 0)
        //             // console.log(deleteFiles(DelArrPath), 'deleteFiles(DelArrPath)');
        //             deleteFiles(DelArrPath)
                    

        //         }
        //     } catch (delErr) {
        //         console.log('删除方法有异常\n', delErr)
        //     }
            
        // });

        // fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
        //     pb = new ProgressBar("正在上传...", 0);
        //     readFiles(dirPath)
        // })


        ftp.connect(connectionProperties)

        ftp.on("ready", async () => {
            db = new ProgressBar('正在删除...', 0)
            const a = await deleteFiles(DelArrPath)
            console.log(a);
            console.log(1111111111111111111111111111111111);
        });
        fs.readdir(dirPath, { withFileTypes: true }, async (err, files) => {
            pb = new ProgressBar("正在上传...", 0);
            await readFiles(dirPath)
        })
        // fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
        //     pb = new ProgressBar("正在上传...", 0);
        //     readFiles(dirPath).then(res => {
        //         console.log(res);
        //     })
        // })
    })
}