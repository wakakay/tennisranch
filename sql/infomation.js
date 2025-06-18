CREATE TABLE `oc_information` (
    `information_id` int(11) NOT NULL AUTO_INCREMENT,
    `sort_order` int(3) DEFAULT '0',
    `status` tinyint(1) DEFAULT '1',
    PRIMARY KEY (`information_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE `information` (
    `information_id` int(11) NOT NULL AUTO_INCREMENT,
    `bottom` int(1) NOT NULL DEFAULT '0',
    `sort_order` int(3) NOT NULL DEFAULT '0',
    `status` tinyint(1) NOT NULL DEFAULT '1',
    PRIMARY KEY (`information_id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;




CREATE TABLE `oc_information_description` (
    `information_id` int(11) NOT NULL,
    `language_id` int(11) NOT NULL,
    `title` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` mediumtext COLLATE utf8mb4_unicode_ci,
    `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `meta_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `meta_keyword` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`information_id`,`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;



CREATE TABLE `information_description` (
    `information_id` int(11) NOT NULL,
    `language_id` int(11) NOT NULL,
    `title` varchar(64) NOT NULL,
    `description` text NOT NULL,
    `meta_title` varchar(255) NOT NULL,
    `meta_description` varchar(255) NOT NULL,
    `meta_keyword` varchar(255) NOT NULL,
    PRIMARY KEY (`information_id`,`language_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;




CREATE TABLE `oc_information_to_layout` (
    `information_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL DEFAULT '0',
    `layout_id` int(11) DEFAULT '0',
    PRIMARY KEY (`information_id`,`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;



CREATE TABLE `information_to_layout` (
    `information_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL,
    `layout_id` int(11) NOT NULL,
    PRIMARY KEY (`information_id`,`store_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;





CREATE TABLE `oc_information_to_store` (
    `information_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL DEFAULT '0',
    PRIMARY KEY (`information_id`,`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE `information_to_store` (
    `information_id` int(11) NOT NULL,
    `store_id` int(11) NOT NULL,
    PRIMARY KEY (`information_id`,`store_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

