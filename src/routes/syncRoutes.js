/**
 * 同步路由配置
 */

const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const bannerController = require('../controllers/BannerController');

/**
 * @swagger
 * /api/sync/category:
 *   post:
 *     tags: [Sync]
 *     summary: 同步分类数据
 *     description: 同步分类及其相关的所有数据表
 *     responses:
 *       200:
 *         description: 同步成功
 *       500:
 *         description: 服务器错误
 */
router.post('/category', syncController.syncCategory);

/**
 * @swagger
 * /api/sync/seo:
 *   post:
 *     tags: [Sync]
 *     summary: 同步SEO数据
 *     description: 同步URL别名到SEO URL表
 */
router.post('/seo', syncController.syncSeo);

/**
 * @swagger
 * /api/sync/option:
 *   post:
 *     tags: [Sync]
 *     summary: 同步选项数据
 *     description: 同步商品选项及其相关的所有数据表
 */
router.post('/option', syncController.syncOption);

/**
 * @swagger
 * /api/sync/option-extended:
 *   post:
 *     tags: [Sync]
 *     summary: 同步选项扩展数据
 *     description: 同步商品选项的扩展字段
 */
router.post('/option-extended', syncController.syncOptionExtended);

/**
 * @swagger
 * /api/sync/filter:
 *   post:
 *     tags: [Sync]
 *     summary: 同步筛选器数据
 *     description: 同步筛选器及其相关的所有数据表
 */
router.post('/filter', syncController.syncFilter);

/**
 * @swagger
 * /api/sync/manufacturer:
 *   post:
 *     tags: [Sync]
 *     summary: 同步制造商数据
 *     description: 同步制造商及其相关的所有数据表
 */
router.post('/manufacturer', syncController.syncManufacturer);

/**
 * @swagger
 * /api/sync/tax:
 *   post:
 *     tags: [Sync]
 *     summary: 同步税率数据
 *     description: 同步税率相关的所有数据表，包括tax_class、tax_rate、tax_rate_to_customer_group和tax_rule
 */
router.post('/tax', syncController.syncTax);

/**
 * @swagger
 * /api/sync/banner:
 *   post:
 *     tags: [Sync]
 *     summary: 同步Banner数据
 *     description: 同步Banner及其相关的所有数据表
 *     responses:
 *       200:
 *         description: 同步成功
 *       500:
 *         description: 服务器错误
 */
router.post('/banner', bannerController.sync.bind(bannerController));

module.exports = router; 