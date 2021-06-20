const Client = require("@findsoft/ftp");
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
            host: projectOptions.pluginOptions.ftp.host // '192.168.1.101' // 
        };
        const remoteFtpPath = projectOptions.pluginOptions.ftp.remoteFtpPath // '/F/ftpserve-home' //
        const hasWhite = projectOptions.pluginOptions.ftp.whiteList || false; // false表示没设置白名单，不执行删除、空数组表示不保护任何文件，否则保护数组文件
        const whiteList = projectOptions.pluginOptions.ftp.whiteList || []; // 白名单-入参-文件&文件夹
        const serveWhite = whiteList.map( path => {
            return remoteFtpPath + path
        }); // 白名单-匹配服务器地址-list
        const allWhiteDir = []; // 所有白名单-文件夹类型
        const allDir = []; // 所有文件夹
        const dirPath = `${process.cwd()}/dist/`;
        // const spinner = ora("正在和服务器同步")
        // eslint-disable-next-line no-unused-vars
        let pb = null;
        let db = null;
        const ACTIONS = []

        /** ftp-delete */
        const ftpDelete = (delPath, i, l) => {
            return new Promise(resolve => {
                ftp.delete(delPath, (de)=>{
                    if (de) console.log(de)
                })
                db.render({completed: i, total: l})
                resolve()
            })
        }
        /** ftp-rmdir */
        const ftpRmdir = (rmPath) => {
            return new Promise(resD => {
                ftp.rmdir(rmPath, true, (errD)=>{
                    if (errD) console.log(errD,'??????')
                    console.log(`${rmPath}文件夹删除完毕`)
                    resD()
                })
            })
        }
        /**
         * 将白名单地址转化成文件地址
         * @param {*} remove 需要去掉的前缀地址
         * @param {*} arrList 需要转化的arr
         */
        const transServeWhite = (remove = remoteFtpPath, arrList = allWhiteDir) => {
            const newArrList = arrList.map(str => {return str.replace(remove, '')});
            const resArr = [];
            newArrList.forEach(path => {
                const pathArr = path.split('/');
                const getPathRecoure = (i) => {
                    if (i === 0) return pathArr[i];
                    return `${getPathRecoure(i-1)}/${pathArr[i]}`;
                }
                for(let i=0; i<pathArr.length; i+=1) { resArr.push(getPathRecoure(i)) }
            });
            return resArr;
        }
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
                                                const newName = file.name
                                                const data1 = {
                                                    dir,
                                                    dirName: `${dir}/${newName}`,
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
                                        ftp.mkdir(element.dir, true, (() => {
                                            ftp.put(element.data, element.dirName, (err2) => {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                // ftp.end();
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
        /** 删除文件-递归删除子文件 */
        const deleteFiles = (filePath)=> {
            return new Promise((res, rej) => {
                const actions = []; // 读取server文件action
                const fileList = []; // 需要处理的files
                const actionDel = []; // 执行操作action
                ftp.list(filePath, (err, files) => {
                    if (err) rej(err);
                    if ( files && files.length > 0) {
                        for (let i=0; i<files.length; i++) {
                            const fileIndex = files[i];
                            const action = () => {
                                return new Promise(resolve => {
                                    ( (file) => {
                                        const delPath = `${filePath}/${file.name}`; // 要删除的地址
                                        const pathRight = serveWhite.includes(delPath); // 地址是否和白名单匹配正确
                                        // 如果地址对应白名单地址，跳出该方法。否则执行删除
                                        if (file.type === '-') { // this is file ---文件类型
                                            if (pathRight) {
                                                allWhiteDir.push(filePath.replace(remoteFtpPath, '')); // 匹配正确，把父级文件夹传入wList
                                            } else {
                                                fileList.push({...file, delPath}); // 不正确，传入删除action
                                            }
                                            resolve();
                                        } else if (file.type === 'd') { // this is directory ---文件夹类型
                                            allDir.push(delPath.replace(remoteFtpPath, '')); // 文件夹-传入所有文件地址
                                            if (!pathRight) {
                                                deleteFiles(delPath).then(()=>{
                                                    resolve();
                                                })
                                            } else {
                                                allWhiteDir.push(delPath);
                                                resolve();
                                            }
                                        } else { // i dont know, symlink?
                                            if (!pathRight) fileList.push({...file, delPath});
                                            resolve();
                                        }
                                    })(fileIndex)
                                })
                            }
                            actions.push(action())
                        }
                        // 或得到了所有要删除的文件，开始删除
                        Promise.all(actions).then(()=>{
                            for(let i=0; i<fileList.length; i++) {
                                actionDel.push(ftpDelete(fileList[i].delPath, i, fileList.length))
                            }
                            Promise.all(actionDel).then(()=>{
                                db.render({completed: fileList.length, total: fileList.length})
                                res(`${filePath}删除完了`)
                                console.log(`--${filePath}删除完毕`);
                            })
                        })
                    } else {
                        res(`${filePath}无内容`)
                    }
                })
            })
        }
        /** 删除文件 */
        async function removeFile(removePath) {
            return new Promise( (res, rej) => {
                const actionList = []
                let arr = [];
                ftp.list(removePath, (rErr, rList)=>{
                    if (rErr) rej(err);
                    if (rList && rList.length > 0) {
                        arr = rList.filter(rf=>{ // 用白名单对serveList取反
                            const resRF = whiteList.includes(rf.name);
                            if (rf.type === 'd') allDir.push(rf.name);
                            if (rf.type === 'd' && resRF) allWhiteDir.push(rf.name);
                            return !resRF;
                        }).map(rm=>{
                            return {name:rm.name,type:rm.type}
                        })
                        if (arr && arr.length > 0) {
                            for (let i=0; i<arr.length; i++) {
                                const path = `${remoteFtpPath}${arr[i].name}`
                                if (arr[i].type === 'd') {
                                    actionList.push(deleteFiles(path))
                                }else {
                                    actionList.push(ftpDelete(path, 1, 1))
                                }
                            }
                        } else {
                            rej('没有可删除的文件！')
                        }
                        Promise.all(actionList).then(()=>{
                            res('文件夹删除完毕');
                        }).catch(err=>{
                            console.log('removeFile function has error\n',err)
                            rej(err);
                        })
                    } else {
                        res('无匹配文件夹');
                    }
                })
                
            })
        }
        /** 删除文件夹 */
        const removeDir = (delArr) => {
            return new Promise( (resolve, reject) => {
                const DirTree = delArr.map(da => {return da.split('/')});
                const maxLength = Math.max(...DirTree.map(dr => {return dr.length})); // 获得文件夹深度
                const nextArr = []; // 下一轮删除的数组
                const thisArr = []; // 该轮删除的数组
                const actionList = []; // rmdir-promise
                DirTree.forEach( (dtv, dti) => {
                    if (dtv.length === maxLength) thisArr.push(delArr[dti]);
                    else nextArr.push(delArr[dti]);
                });
                for (let i=0; i<thisArr.length; i++) {
                    const path = `${remoteFtpPath}${thisArr[i]}`
                    actionList.push(ftpRmdir(path))
                }
                Promise.all(actionList).then(() => {
                    if (nextArr.length > 0) {
                        removeDir(nextArr).then(()=>{
                            resolve();
                        })
                    } else {
                        resolve();
                    }
                })
            })
        }
        ftp.connect(connectionProperties);

        ftp.on("ready", async () => {
            try {
                if (!hasWhite) {
                    console.log('未设置删除白名单参数，不执行删除操作');
                } else {
                    if (whiteList.length === 0) console.log('白名单为空数组，不保护文件');
                    db = new ProgressBar('正在删除...', 0);
                    await removeFile(remoteFtpPath);
                    console.log('文件删除完毕，开始删除文件夹...');
                    const transServeWhiteRes = transServeWhite(remoteFtpPath, allWhiteDir); // 所有白名单文件夹结果
                    const CanDelDirArr = allDir.filter(all => {return !transServeWhiteRes.includes(all)});
                    await removeDir(CanDelDirArr);
                    console.log('文件夹删除完毕，开始上传...');
                }
            } catch (delErr) {
                console.log('删除方法异常\n', delErr)
            }
            fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
                pb = new ProgressBar("正在上传...", 0);
                readFiles(dirPath).finally(()=>{
                    ftp.end();
                })
            });
        });


    })
}