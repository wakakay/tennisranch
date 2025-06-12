const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const ProductController = require('../controllers/ProductController');
const bannerController = require('../controllers/BannerController');
const CustomerOtherController = require('../controllers/CustomerOtherController');

/**
 * 同步分类数据
 */
router.post('/category', syncController.syncCategory);

/**
 * 同步SEO数据
 */
router.post('/seo', syncController.syncSeo);

/**
 * 同步Option数据
 */
router.post('/option', syncController.syncOption);

/**
 * 同步Option扩展字段
 */
router.post('/option-extended', syncController.syncOptionExtended);

/**
 * 同步筛选数据
 */
router.post('/filter', syncController.syncFilter);

/**
 * 同步制造商数据
 */
router.post('/manufacturer', syncController.syncManufacturer);

/**
 * 同步产品数据
 */
router.post('/product', ProductController.syncProduct);

/**
 * 清理无效的产品选项值数据
 */
router.post('/clear-invalid-product-option-values', ProductController.clearInvalidProductOptionValues);

/**
 * 同步退货数据
 */
router.post('/return', syncController.syncReturn);

/**
 * 同步评论数据
 */
router.post('/review', syncController.syncReview);

/**
 * 同步Banner数据
 */
router.post('/banner', bannerController.sync.bind(bannerController));

/**
 * @swagger
 * /api/sync/customer:
 *   post:
 *     tags: [Sync]
 *     summary: 同步客户数据
 *     description: 同步客户相关的所有数据表，包括 customer 和 address
 */
router.post('/customer', syncController.syncCustomer);

/**
 * @swagger
 * /api/sync/customer-other:
 *   post:
 *     tags: [Sync]
 *     summary: 同步其他客户相关表数据
 *     description: 同步客户相关的其他数据表，包括 activity、group、login 等
 */
router.post('/customer-other', CustomerOtherController.sync);

module.exports = router; 