# 网站备份与恢复记录

**备份时间**: 2026-02-13
**备份原因**: 修改首页工具列表动态化前的安全备份
**文件位置**: `/var/www/peng-ip-website/app_backup_20260213.tar.gz`

## 1. 备份命令 (服务器端)

虽然已经执行过，但记录于此以备后用：

### 方式 A: 使用自动化脚本 (推荐)

在服务器上执行我们刚才上传的脚本:

```bash
cd /var/www/peng-ip-website
chmod +x deploy/backup.sh
./deploy/backup.sh
```

这会自动备份数据库和代码到 `backups/` 目录，并清理旧备份。

### 方式 B: 手动备份

如果不想用脚本，可以手动敲命令：

```bash
cd /var/www/peng-ip-website
# 手动备份代码 (不含 node_modules/.next)
tar -czvf app_backup_$(date +"%Y%m%d").tar.gz app/ public/ prisma/ package.json
# 手动备份数据库
cp dev.db dev_backup_$(date +"%Y%m%d").db
```

这会将整个 `app/` 目录打包成一个压缩文件。

## 2. 恢复/还原方法

如果新代码出现了严重问题，或者网站无法访问，可以通过以下步骤将 `app/` 目录还原到备份时的状态。

### 步骤 A: 删除当前的有问题的代码 (可选，但推荐)

```bash
cd /var/www
rm -rf peng-ip-website/
```

### 步骤 B: 解压备份

```bash
cd /var/www
tar -xzvf peng-website-backup-20260214.tar.gz
```
*(这会自动把 peng-ip-website 文件夹解压出来)*

### 步骤 C: 重新安装依赖并构建

恢复后，需要重新安装被排除的目录：

```bash
cd /var/www/peng-ip-website
npm install
npm run build
pm2 restart peng-website
```

## 3. 注意事项

*   这个备份**仅包含代码**（`app` 目录）。
*   **不包含数据库** (`dev.db`)。如果你把数据库改坏了，这个备份救不回来。
*   数据库文件通常在 `/var/www/peng-ip-website/dev.db`。如果需要备份数据库，只需复制该文件：`cp dev.db dev.db.backup`。
