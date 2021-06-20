# vue-cli-plugin-ftp

```JavaScript
// 1.安装插件
  vue add ftp

// 2.vue.config.js中设置配置
  pluginOptions: {
    ftp: {
      host: "192.168.31.147", // ftp地址
      remoteFtpPath: "DISK-D/soft/tomcat8/webapps/product/", // 项目地址
      whiteList: ['css', 'js', 'img'] // 删除白名单——非必填
      hasUploadWhite: false // 上传是否也需要白名单过滤
     }
  },

// 3.package.json中 build的命令修改为
  vue-cli-service build --no-clean && vue-cli-service ftpdeploy

// 4.remark
  // whiteList
  // 如果不设置，不执行删除操作
  // 如果设置[]，表示上传前会清空所有文件
  // 否则会按照入参，保留对应文件

  // hasUploadWhite
  // 上传文件，是否要按白名单过滤
  // 默认值 false
  // true-不会覆盖文件
  // false-会用新文件覆盖
  ```
