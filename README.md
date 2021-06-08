# vue-cli-plugin-ftp

```JavaScript
// 1.安装插件
  vue add ftp

// 2.vue.config.js中设置配置
  pluginOptions: {
    ftp: {
      host: "192.168.31.147", // ftp地址
      remoteFtpPath: "DISK-D/soft/tomcat8/webapps/product/", // 项目地址
      delArr: ['css', 'js', 'img'] // 上传前需要删除的文件夹
     }
  },

// 3.package.json中 build的命令修改为
  vue-cli-service build --no-clean && vue-cli-service ftpdeploy

// 4.remark
  /**
   * 1、非必填
   * 2、使用前要把地址里的中文名文件都删掉
   * 2、不建议上传非英文名文件（中文会按照encodeURIComponent方式编码）
   */
  delArr
  ```
