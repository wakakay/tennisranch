const { targetPool } = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class RemoveOcPrefixService {
  /**
   * 获取所有带oc_前缀的表名
   * @returns {Promise<string[]>} 表名数组
   */
  async getOcTables() {
    const conn = await targetPool.getConnection();
    try {
      const [tables] = await conn.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tennisranch_4x' 
        AND table_name LIKE 'oc_%'
        ORDER BY table_name
      `);
      return tables.map(table => table.table_name);
    } finally {
      conn.release();
    }
  }

  /**
   * 重命名数据库表，去除oc_前缀
   * @returns {Promise<void>}
   */
  async renameDatabaseTables() {
    const conn = await targetPool.getConnection();
    try {
      await conn.beginTransaction();
      logger.info('开始重命名数据库表，去除oc_前缀...');

      const ocTables = await this.getOcTables();
      logger.info(`找到 ${ocTables.length} 个需要重命名的表`);

      let successCount = 0;
      let errorCount = 0;

      for (const tableName of ocTables) {
        try {
          const newTableName = tableName.replace(/^oc_/, '');

          // 检查新表名是否已存在
          const [existingTable] = await conn.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'tennisranch_4x' 
            AND table_name = ?
          `, [newTableName]);

          if (existingTable.length > 0) {
            logger.info(`表 ${newTableName} 已存在，跳过 ${tableName} 的重命名`);
            continue;
          }

          // 执行重命名
          await conn.query(`RENAME TABLE \`${tableName}\` TO \`${newTableName}\``);
          logger.info(`✓ ${tableName} → ${newTableName}`);
          successCount++;
        } catch (error) {
          logger.error(`重命名表 ${tableName} 失败:`, error);
          errorCount++;
        }
      }

      await conn.commit();
      logger.success(`数据库表重命名完成！成功: ${successCount}, 失败: ${errorCount}`);

      return {
        success: true,
        message: `数据库表重命名完成！成功: ${successCount}, 失败: ${errorCount}`,
        successCount,
        errorCount
      };

    } catch (error) {
      await conn.rollback();
      logger.error('数据库表重命名失败:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 获取需要修改的代码文件列表
   * @returns {string[]} 文件路径数组
   */
  getCodeFilesToUpdate() {
    return [
      'src/services/ProductService.js',
      'src/services/syncService.js',
      'src/services/InformationSync.js',
      'src/services/CustomerOtherSync.js',
      'src/services/TagSync.js',
      'src/services/ZoneSync.js',
      'src/services/BlogSync.js',
      'src/services/CouponSync.js',
      'src/services/BannerSync.js',
      'src/services/CartSync.js',
      'src/services/GoogleBaseSync.js',
      'src/services/CustomerSync.js',
      'src/services/ReturnSync.js',
      'src/services/ReviewSync.js',
      'src/controllers/syncController.js',
      'test-db-connection.js'
    ];
  }

  /**
   * 更新单个文件中的表名引用
   * @param {string} filePath - 文件路径
   * @returns {Promise<{success: boolean, changes: number}>}
   */
  async updateFileTableNames(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf8');

      let updatedContent = content;
      let changeCount = 0;

      // 替换 oc_表名 为 表名（不包含tennisranch_4x.前缀的情况）
      updatedContent = updatedContent.replace(/\boc_([a-zA-Z_]+)\b/g, (match, tableName) => {
        changeCount++;
        return tableName;
      });

      // 替换 tennisranch_4x.oc_表名 为 tennisranch_4x.表名
      updatedContent = updatedContent.replace(/tennisranch_4x\.oc_([a-zA-Z_]+)\b/g, (match, tableName) => {
        changeCount++;
        return `tennisranch_4x.${tableName}`;
      });

      // 如果有变更，写入文件
      if (changeCount > 0) {
        await fs.writeFile(fullPath, updatedContent, 'utf8');
        logger.info(`✓ 更新文件 ${filePath}，共 ${changeCount} 处修改`);
      }

      return { success: true, changes: changeCount };
    } catch (error) {
      logger.error(`更新文件 ${filePath} 失败:`, error);
      return { success: false, changes: 0, error: error.message };
    }
  }

  /**
   * 批量更新所有代码文件中的表名引用
   * @returns {Promise<void>}
   */
  async updateCodeFiles() {
    logger.info('开始更新代码文件中的表名引用...');

    const filesToUpdate = this.getCodeFilesToUpdate();
    let totalChanges = 0;
    let successFiles = 0;
    let errorFiles = 0;

    for (const filePath of filesToUpdate) {
      try {
        const result = await this.updateFileTableNames(filePath);
        if (result.success) {
          successFiles++;
          totalChanges += result.changes;
        } else {
          errorFiles++;
          logger.error(`文件 ${filePath} 更新失败: ${result.error}`);
        }
      } catch (error) {
        errorFiles++;
        logger.error(`处理文件 ${filePath} 时发生错误:`, error);
      }
    }

    logger.success(`代码文件更新完成！成功: ${successFiles}, 失败: ${errorFiles}, 总修改: ${totalChanges} 处`);

    return {
      success: true,
      message: `代码文件更新完成！成功: ${successFiles}, 失败: ${errorFiles}, 总修改: ${totalChanges} 处`,
      successFiles,
      errorFiles,
      totalChanges
    };
  }

  /**
   * 执行完整的oc_前缀移除操作
   * @returns {Promise<void>}
   */
  async removeOcPrefix() {
    try {
      logger.info('=== 开始执行去除oc_前缀操作 ===');

      // 第一步：重命名数据库表
      logger.info('第一步：重命名数据库表...');
      const dbResult = await this.renameDatabaseTables();

      // 第二步：更新代码文件
      logger.info('第二步：更新代码文件...');
      const codeResult = await this.updateCodeFiles();

      logger.success('=== oc_前缀移除操作完成 ===');

      return {
        success: true,
        message: 'oc_前缀移除操作完成',
        database: dbResult,
        code: codeResult
      };

    } catch (error) {
      logger.error('执行oc_前缀移除操作失败:', error);
      throw error;
    }
  }
}

module.exports = RemoveOcPrefixService;
