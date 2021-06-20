# 白名单-删除思路

> 正常思路
> 删除文件夹，顺带会把文件夹里面的文件一并删除
> 
> 但用 `ftp` 的 `rmdir` 方法删除文件夹，需要保证文件夹是空文件夹
> 所以删除功能就需要分成两个部分
> 删除文件和删除文件夹

### 主要步骤
- 删除文件
- 删除文件夹

#### 删除文件夹
- 如何知道要删除哪些文件夹？
  - 获得到所有文件夹地址的数组（父子都要）`all-arr`
  - 根据白名单地址，获得白名单对应的文件夹地址（父子都要）`white-arr`
  - 数组取差值，获得到可以删除的数组（所有父子）`del-arr`
- 怎么删除
  - 根据层级，先删除最里层的文件夹（`rmdir`方法需要保证空文件夹）
  - 递归删除，出口为：`del-arr`为空数组

#### 写法上可能的优化
- 如何知道要删除哪些文件夹？
  - 根据白名单地址，获得到其他tree-list地址
  - 通过一条树，反向获得到其他所有树分支