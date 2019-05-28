/*
 Navicat Premium Data Transfer

 Source Server         : 腾讯云
 Source Server Type    : MySQL
 Source Server Version : 50628
 Source Host           : 59939c0a9a983.gz.cdb.myqcloud.com:5579
 Source Schema         : 2019_find_focus

 Target Server Type    : MySQL
 Target Server Version : 50628
 File Encoding         : 65001

 Date: 14/04/2019 23:05:03
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_daily_statistics
-- ----------------------------
DROP TABLE IF EXISTS `t_daily_statistics`;
CREATE TABLE `t_daily_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `create_time` int(11) NOT NULL,
  `update_time` int(11) NOT NULL DEFAULT '0',
  `registration_amount` int(11) unsigned NOT NULL COMMENT '当日注册量',
  `active_user` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '活跃用户',
  `active_user_composition` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '活跃用户构成',
  `order_quantity` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '下单量',
  `new_vip_user` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '新增VIP',
  `vip_user_amount` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '总VIP',
  `user_amount` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '总用户量',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='日常数据统计';

SET FOREIGN_KEY_CHECKS = 1;
