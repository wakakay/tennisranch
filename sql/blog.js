blog同步到oc_article
oc_article.article_id=blog.blog_id
oc_article.topic_id=0
oc_article.author='system'
oc_article.rating=0
oc_article.sort_order=oc_article.sort_order
oc_article.status=oc_article.status
oc_article.date_added=当前时间
oc_article.date_modified=当前时间


CREATE TABLE `blog` (
    `blog_id` int(11) NOT NULL AUTO_INCREMENT,
    `bottom` int(1) NOT NULL DEFAULT '0',
    `sort_order` int(3) NOT NULL DEFAULT '0',
    `status` tinyint(1) NOT NULL DEFAULT '1',
    PRIMARY KEY (`blog_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
CREATE TABLE `oc_article` (
    `article_id` int(11) NOT NULL AUTO_INCREMENT,
    `topic_id` int(11) DEFAULT '0',
    `author` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `rating` int(11) DEFAULT '0',
    `sort_order` int(3) NOT NULL DEFAULT '0',
    `status` tinyint(1) DEFAULT '0',
    `date_added` datetime DEFAULT NULL,
    `date_modified` datetime DEFAULT NULL,
    PRIMARY KEY (`article_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;



blog_descriptiont同步到oc_article_description
oc_article_description.article_id=blog_description.blog_id
oc_article_description.language_id =1
oc_article_description.tag_id=blog_description.tag_id
oc_article_description.title=blog_description.title
oc_article_description.sub_title=blog_description.sub_title
oc_article_description.image=blog_description.image
oc_article_description.category_id=blog_description.category_id
oc_article_description.description=blog_description.description
oc_article_description.meta_title=blog_description.meta_title
oc_article_description.meta_description=blog_description.meta_description
oc_article_description.meta_keyword=blog_description.meta_keyword

CREATE TABLE `blog_description` (
    `blog_id` int(11) NOT NULL,
    `language_id` int(11) NOT NULL,
    `tag_id` int(11) NOT NULL,
    `title` varchar(64) NOT NULL,
    `sub_title` varchar(128) NOT NULL COMMENT '简介',
    `image` varchar(255) NOT NULL COMMENT '简介图片',
    `category_id` varchar(255) NOT NULL COMMENT '详情底部按钮跳转分类的id',
    `description` text NOT NULL,
    `meta_title` varchar(255) NOT NULL,
    `meta_description` varchar(255) NOT NULL,
    `meta_keyword` varchar(255) NOT NULL,
    PRIMARY KEY (`blog_id`,`language_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE TABLE `oc_article_description` (
    `article_id` int(11) NOT NULL,
    `language_id` int(11) NOT NULL,
    `tag_id` int(11) NOT NULL,
    `title` varchar(64) NOT NULL,
    `sub_title` varchar(128) NOT NULL COMMENT '简介',
    `image` varchar(255) NOT NULL COMMENT '简介图片',
    `category_id` varchar(255) NOT NULL COMMENT '详情底部按钮跳转分类的id',
    `description` text NOT NULL,
    `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `meta_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `meta_keyword` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`article_id`,`language_id`),
    KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


blog_to_layout同步到oc_article_to_layout
article_id=blog_id
store_id=store_id
layout_id=layout_id

CREATE TABLE `blog_to_layout` (
    `blog_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL,
    `layout_id` int(11) NOT NULL,
    PRIMARY KEY (`blog_id`,`store_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE TABLE `oc_article_to_layout` (
    `article_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL DEFAULT '0',
    `layout_id` int(11) DEFAULT '0',
    PRIMARY KEY (`article_id`,`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;



blog_to_store同步到oc_article_to_store
article_id=blog_id
store_id=store_id


CREATE TABLE `blog_to_store` (
    `blog_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL,
    PRIMARY KEY (`blog_id`,`store_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE TABLE `oc_article_to_store` (
    `article_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL DEFAULT '0',
    PRIMARY KEY (`article_id`,`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
