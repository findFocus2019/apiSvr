
CREATE TABLE `t_mch`
(
  `id` bigint
(20) NOT NULL AUTO_INCREMENT,
  `create_time` int
(11) NOT NULL DEFAULT '0',
  `update_time` int
(11) NOT NULL DEFAULT '0',
  `status` tinyint
(11) NOT NULL DEFAULT '0',
  `username` varchar
(64) NOT NULL DEFAULT '' COMMENT '用户姓名',
  `mobile` varchar
(16) NOT NULL DEFAULT '' COMMENT '电话',
  `email` varchar
(64) NOT NULL DEFAULT '' COMMENT '邮箱',
  `password` varchar
(32) NOT NULL COMMENT '密码',
  `info` text COMMENT '账户信息',
  PRIMARY KEY
(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商户表';

-- 添加关联商户

ALTER TABLE t_goods ADD COLUMN `mch_id` BIGINT
(20) DEFAULT 0 NOT NULL COMMENT '商户id';