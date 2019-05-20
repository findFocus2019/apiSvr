-- 延长收货时间
ALTER TABLE t_order ADD COLUMN express_extend_num TINYINT(2) DEFAULT 0 NOT NULL COMMENT '延长收货时间';

ALTER TABLE t_admin ADD COLUMN group_id INT(11) NOT NULL DEFAULT 0;

ALTER TABLE t_order_item ADD COLUMN profit INT(11) NOT NULL DEFAULT 0 COMMENT '总利润';
ALTER TABLE t_order_item ADD COLUMN profit_over INT(11) NOT NULL DEFAULT 0 COMMENT '剩余利润';

--------------- 代金券合并
ALTER TABLE t_user_ecard ADD COLUMN exchange TEXT DEFAULT '' COMMENT '合并记录';
