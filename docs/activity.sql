-------- t_goods添加活动字段 -------------
ALTER TABLE t_goods ADD COLUMN activity_type TINYINT
(2) DEFAULT 0 COMMENT '活动类型，0:无1:砍价';
ALTER TABLE t_goods ADD COLUMN activity_stock INT
(11) DEFAULT 0 COMMENT '活动库存';
ALTER TABLE t_goods ADD COLUMN activity_config text COMMENT '活动配置';
----

ALTER TABLE t_order ADD COLUMN activity_type TINYINT
(2) DEFAULT 0 COMMENT '活动类型，0:无1:砍价';
ALTER TABLE t_order ADD COLUMN activity_price INT
(11) DEFAULT 0 COMMENT '活动减少价格';