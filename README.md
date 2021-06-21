# vue-cli-plugin-ftp

```JavaScript
// 1.安装插件
  vue add ftp

// 2.vue.config.js中设置配置
  pluginOptions: {
    ftp: {
      host: "192.168.31.147", // ftp地址
      remoteFtpPath: "DISK-D/soft/tomcat8/webapps/product/", // 项目地址
      whiteList: ['css', 'js', 'img'], // 删除白名单——非必填
      uploadWhite: false // 上传是否也需要白名单过滤
     }
  },

// 3.package.json中 build的命令修改为
  vue-cli-service build --no-clean && vue-cli-service ftpdeploy
  ```
| 属性 | 说明 | 类型 | 默认值 | 必填 | 版本 |
|---|---|---|---|---|---|
| host | ftp服务地址 | ip地址 | '' | 是 | |
| remoteFtpPath | 需要ftp操作的文件地址 | string | '' | 是 ||
| whiteList | 需要保护的白名单数组，不填表示只上传。[]会删除地址对应所有文件 | string[] | undefined | 否 | >1.4.1 |
| uploadWhite | 配合whiteList使用，上传文件时，如果为true，则不会上传白名单里的文件。默认会上传 | boolean | false | 否 | >1.4.1 |
