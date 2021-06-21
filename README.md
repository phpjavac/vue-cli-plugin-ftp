# vue-cli-plugin-ftp

```JavaScript
// 1.安装插件
  vue add ftp

// 2.vue.config.js中设置配置
  pluginOptions: {
    ftp: {
      host: "192.168.31.147", // ftp地址
      remoteFtpPath: "DISK-D/soft/tomcat8/webapps/product/", // 项目地址
      deleteWhite: ['META-INF', 'upload', 'WEB-INF'], // 删除白名单
      uploadWhite: ['static/installer/demo.exe'] // 上传白名单
     }
  },

// 3.package.json中 build的命令修改为
  vue-cli-service build --no-clean && vue-cli-service ftpdeploy
  ```
| 属性 | 说明 | 类型 | 默认值 | 必填 | 版本 |
|---|---|---|---|---|---|
| host | ftp服务地址 | ip地址 | '' | 是 | |
| remoteFtpPath | 需要ftp操作的文件地址 | string | '' | 是 ||
| deleteWhite | 删除白名单;不传表示不删除ftp服务器旧文件;[]会删除所有文件; | string[] | undefined | 否 | >1.4.1 |
| uploadWhite | 上传白名单;不传和[]表示都上传 | string[] | [] | 否 | >1.4.1 |
