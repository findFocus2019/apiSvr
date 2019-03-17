-- 延长收货时间
ALTER TABLE t_order ADD COLUMN express_extend_num TINYINT(2) DEFAULT 0 NOT NULL COMMENT '延长收货时间';