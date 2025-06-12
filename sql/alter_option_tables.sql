-- 修改 oc_option_description 表，添加 related_children_option_id 字段
ALTER TABLE `oc_option_description`
ADD COLUMN `related_children_option_id` int(11) DEFAULT NULL AFTER `name`;

-- 修改 oc_option_value 表，添加 price_prefix, price, related_option_value_ids 字段
ALTER TABLE `oc_option_value`
ADD COLUMN `price_prefix` varchar(1) DEFAULT NULL AFTER `option_id`,
ADD COLUMN `price` decimal(15,4) DEFAULT NULL AFTER `price_prefix`,
ADD COLUMN `related_option_value_ids` text COLLATE utf8mb4_unicode_ci AFTER `price`;

-- 修改 oc_option_value_description 表，添加 linkage_option_id 字段
ALTER TABLE `oc_option_value_description`
ADD COLUMN `linkage_option_id` int(11) DEFAULT NULL AFTER `name`; 