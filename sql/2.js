CREATE TABLE `afterpay_order` (
  `afterpay_order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `afterpay_reference_id` varchar(40) NOT NULL,
  `currency_code` char(3) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `date_added` datetime NOT NULL,
  `date_modified` datetime NOT NULL,
  PRIMARY KEY (`afterpay_order_id`)
) ENGINE=MyISAM AUTO_INCREMENT=128 DEFAULT CHARSET=utf8;


CREATE TABLE `afterpay_order` (
  `afterpay_order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `afterpay_reference_id` varchar(40) NOT NULL,
  `currency_code` char(3) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `date_added` datetime NOT NULL,
  `date_modified` datetime NOT NULL,
  PRIMARY KEY (`afterpay_order_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;


CREATE TABLE `afterpay_order_transaction` (
  `afterpay_order_transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `afterpay_order_id` int(11) NOT NULL,
  `date_added` datetime NOT NULL,
  `type` enum('approved','declined','refunded') DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`afterpay_order_transaction_id`)
) ENGINE=MyISAM AUTO_INCREMENT=128 DEFAULT CHARSET=utf8;

CREATE TABLE `afterpay_order_transaction` (
  `afterpay_order_transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `afterpay_order_id` int(11) NOT NULL,
  `date_added` datetime NOT NULL,
  `type` enum('approved','declined','refunded') DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`afterpay_order_transaction_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
