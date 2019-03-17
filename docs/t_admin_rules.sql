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

 Date: 17/03/2019 17:38:52
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_admin_rules
-- ----------------------------
DROP TABLE IF EXISTS `t_admin_rules`;
CREATE TABLE `t_admin_rules` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `create_time` int(11) NOT NULL DEFAULT '0',
  `update_time` int(11) NOT NULL DEFAULT '0',
  `status` tinyint(11) NOT NULL DEFAULT '0',
  `name` varchar(11) NOT NULL,
  `pid` bigint(11) NOT NULL DEFAULT '0',
  `router` varchar(64) NOT NULL DEFAULT '',
  `icon` varchar(24) NOT NULL DEFAULT '',
  `sort` tinyint(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of t_admin_rules
-- ----------------------------
BEGIN;
INSERT INTO `t_admin_rules` VALUES (1, 0, 0, 1, '首页', 0, '/', 'apps', 0);
INSERT INTO `t_admin_rules` VALUES (2, 0, 0, 1, '用户管理', 0, '/user', 'people', 1);
INSERT INTO `t_admin_rules` VALUES (3, 0, 0, 1, '资讯管理', 0, '/posts', 'rss_feed', 2);
INSERT INTO `t_admin_rules` VALUES (4, 0, 0, 1, '审批管理', 0, '/apply', 'spellcheck', 3);
INSERT INTO `t_admin_rules` VALUES (5, 0, 0, 1, '商城管理', 0, '/mall/goods', 'shopping_cart', 4);
INSERT INTO `t_admin_rules` VALUES (6, 0, 0, 1, '账户管理', 0, '/account', 'account_circle', 5);
INSERT INTO `t_admin_rules` VALUES (7, 0, 0, 1, '系统设置', 0, '/config', 'settings', 6);
INSERT INTO `t_admin_rules` VALUES (8, 0, 0, 1, '财务管理', 0, '/mall/payment', 'payment', 7);
INSERT INTO `t_admin_rules` VALUES (9, 0, 0, 1, '签到', 2, '/user/dailySign', '', 0);
INSERT INTO `t_admin_rules` VALUES (10, 0, 0, 1, '分享', 2, '/user/share', '', 0);
INSERT INTO `t_admin_rules` VALUES (11, 0, 0, 1, '收藏', 2, '/user/collection', '', 0);
INSERT INTO `t_admin_rules` VALUES (12, 0, 0, 1, '地址管理', 2, '/user/address', '', 0);
INSERT INTO `t_admin_rules` VALUES (13, 0, 0, 1, '用户收益列表', 2, '/config/task/logs', '', 0);
INSERT INTO `t_admin_rules` VALUES (14, 0, 0, 1, '管理员列表', 6, '/account/list', '', 0);
INSERT INTO `t_admin_rules` VALUES (15, 0, 0, 1, '管理组别', 6, '/account/groups', '', 0);
INSERT INTO `t_admin_rules` VALUES (16, 0, 0, 1, '资讯添加', 3, '/posts/update', '', 1);
INSERT INTO `t_admin_rules` VALUES (17, 0, 0, 1, '阅读', 3, '/posts/view', '', 2);
INSERT INTO `t_admin_rules` VALUES (18, 0, 0, 1, '点赞', 3, '/posts/like', '', 3);
INSERT INTO `t_admin_rules` VALUES (19, 0, 0, 1, '提现申请', 4, '/user/moneyOut', '', 1);
INSERT INTO `t_admin_rules` VALUES (20, 0, 0, 1, '品牌申请', 4, '/user/apply', '', 2);
INSERT INTO `t_admin_rules` VALUES (21, 0, 0, 1, '评论', 4, '/posts/comment', '', 3);
INSERT INTO `t_admin_rules` VALUES (22, 0, 0, 1, '配置添加', 7, '/config/update', '', 0);
INSERT INTO `t_admin_rules` VALUES (23, 0, 0, 1, '广告/图册', 7, '/coinfig/album', '', 0);
INSERT INTO `t_admin_rules` VALUES (24, 0, 0, 1, '收益任务', 7, '/config/task', '', 0);
INSERT INTO `t_admin_rules` VALUES (25, 0, 0, 1, '系统公告', 7, '/config/notice', '', 0);
INSERT INTO `t_admin_rules` VALUES (26, 0, 0, 1, '接口账户信息', 7, '/config/api', '', 0);
INSERT INTO `t_admin_rules` VALUES (27, 0, 0, 1, '商品分类', 5, '/mall/category', '', 2);
INSERT INTO `t_admin_rules` VALUES (28, 0, 0, 1, '商品订单', 5, '/mall/order', '', 1);
INSERT INTO `t_admin_rules` VALUES (29, 0, 0, 1, '评价', 5, '/mall/orderItems', '', 3);
INSERT INTO `t_admin_rules` VALUES (30, 0, 0, 1, '售后', 5, '/mall/order/afters', '', 4);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
