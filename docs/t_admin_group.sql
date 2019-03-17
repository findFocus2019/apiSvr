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

 Date: 17/03/2019 17:38:15
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_admin_group
-- ----------------------------
DROP TABLE IF EXISTS `t_admin_group`;
CREATE TABLE `t_admin_group` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `admin_id` bigint(20) NOT NULL DEFAULT '0',
  `rules` varchar(1000) NOT NULL,
  `status` tinyint(2) NOT NULL DEFAULT '2',
  `create_time` int(11) NOT NULL DEFAULT '0',
  `update_time` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
