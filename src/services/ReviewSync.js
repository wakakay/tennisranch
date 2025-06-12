const { sourcePool, targetPool } = require('../config/database');

class ReviewSync {
  /**
   * 同步评论数据
   * @returns {Promise<void>}
   */
  async syncReview() {
    console.log('开始同步评论数据...');
    
    // 获取源数据库和目标数据库连接
    const sourceConn = await sourcePool.getConnection();
    const targetConn = await targetPool.getConnection();
    
    try {
      // 清空目标表
      console.log('清空目标表...');
      await targetConn.query('TRUNCATE TABLE `oc_review`');
      
      // 从源数据库获取评论数据
      console.log('从源数据库获取评论数据...');
      const [reviews] = await sourceConn.query('SELECT * FROM `review`');
      
      if (reviews.length === 0) {
        console.log('没有评论数据需要同步');
        return;
      }
      
      // 批量插入数据到目标数据库
      console.log(`开始插入 ${reviews.length} 条评论数据...`);
      const batchSize = 1000;
      for (let i = 0; i < reviews.length; i += batchSize) {
        const batch = reviews.slice(i, i + batchSize);
        const values = batch.map(review => [
          review.review_id,
          review.product_id,
          review.customer_id,
          review.author,
          review.text,
          review.rating,
          review.status,
          review.date_added,
          review.date_modified
        ]);
        
        const sql = `
          INSERT INTO oc_review (
            review_id, product_id, customer_id, author, 
            text, rating, status, date_added, date_modified
          ) VALUES ?
        `;
        
        await targetConn.query(sql, [values]);
        console.log(`已同步 ${i + batch.length} / ${reviews.length} 条评论数据`);
      }
      
      console.log('评论数据同步完成');
    } catch (error) {
      console.error('同步评论数据时出错:', error);
      throw error;
    } finally {
      // 释放数据库连接
      sourceConn.release();
      targetConn.release();
    }
  }
}

module.exports = new ReviewSync(); 