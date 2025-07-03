const { sourcePool, targetPool } = require('../config/database');
const logger = require('../utils/logger');

class BlogSync {
  /**
   * 同步博客数据
   * @returns {Promise<void>}
   */
  async syncBlog() {
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();

    try {
      await targetConn.beginTransaction();

      logger.info('开始同步博客数据...');

      // 清空目标表
      logger.info('清空目标表...');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_article');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_article_description');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_article_to_layout');
      await targetConn.query('DELETE FROM tennisranch_4x.oc_article_to_store');
      logger.info('目标表清空完成');

      // 重置自增ID计数器
      await targetConn.query('ALTER TABLE tennisranch_4x.oc_article AUTO_INCREMENT = 1');

      // 同步 blog 表到 oc_article
      logger.info('开始同步 blog 表到 oc_article...');
      const [blogs] = await sourceConn.query(`
        SELECT 
          blog_id, sort_order, status
        FROM blog
      `);
      logger.info(`从源数据库读取到 ${blogs.length} 条博客数据`);

      if (blogs.length > 0) {
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_article (
            article_id, topic_id, author, rating, sort_order, status, date_added, date_modified
          ) VALUES ?
        `, [blogs.map(blog => [
          blog.blog_id,
          0, // topic_id 默认为 0
          'system', // author 默认为 'system'
          0, // rating 默认为 0
          blog.sort_order,
          blog.status,
          currentDate, // date_added 当前时间
          currentDate  // date_modified 当前时间
        ])]);
        logger.info('oc_article 表同步完成');
      }

      // 同步 blog_description 表到 oc_article_description
      logger.info('开始同步 blog_description 表到 oc_article_description...');
      const [blogDescriptions] = await sourceConn.query(`
        SELECT 
          blog_id, tag_id, title, sub_title, image, category_id, 
          description, meta_title, meta_description, meta_keyword
        FROM blog_description
      `);
      logger.info(`从源数据库读取到 ${blogDescriptions.length} 条博客描述数据`);

      if (blogDescriptions.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_article_description (
            article_id, language_id, tag_id, title, sub_title, image, 
            category_id, description, meta_title, meta_description, meta_keyword
          ) VALUES ?
        `, [blogDescriptions.map(desc => [
          desc.blog_id,
          1, // language_id 默认为 1
          desc.tag_id || 0, // 处理可能的空值
          desc.title,
          desc.sub_title,
          desc.image,
          desc.category_id === '' || desc.category_id === null ? 0 : desc.category_id, // 处理空值，设置默认值为0
          desc.description,
          desc.meta_title,
          desc.meta_description,
          desc.meta_keyword
        ])]);
        logger.info('oc_article_description 表同步完成');
      }

      // 同步 blog_to_layout 表到 oc_article_to_layout
      logger.info('开始同步 blog_to_layout 表到 oc_article_to_layout...');
      const [blogToLayouts] = await sourceConn.query(`
        SELECT 
          blog_id, store_id, layout_id
        FROM blog_to_layout
      `);
      logger.info(`从源数据库读取到 ${blogToLayouts.length} 条博客布局关联数据`);

      if (blogToLayouts.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_article_to_layout (
            article_id, store_id, layout_id
          ) VALUES ?
        `, [blogToLayouts.map(layout => [
          layout.blog_id,
          layout.store_id,
          layout.layout_id
        ])]);
        logger.info('oc_article_to_layout 表同步完成');
      }

      // 同步 blog_to_store 表到 oc_article_to_store
      logger.info('开始同步 blog_to_store 表到 oc_article_to_store...');
      const [blogToStores] = await sourceConn.query(`
        SELECT 
          blog_id, store_id
        FROM blog_to_store
      `);
      logger.info(`从源数据库读取到 ${blogToStores.length} 条博客商店关联数据`);

      if (blogToStores.length > 0) {
        await targetConn.query(`
          INSERT INTO tennisranch_4x.oc_article_to_store (
            article_id, store_id
          ) VALUES ?
        `, [blogToStores.map(store => [
          store.blog_id,
          store.store_id
        ])]);
        logger.info('oc_article_to_store 表同步完成');
      }

      await targetConn.commit();
      logger.info('博客数据同步完成');

    } catch (error) {
      await targetConn.rollback();
      logger.error('博客数据同步失败:', error);
      logger.error('错误详情:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;

    } finally {
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new BlogSync();
