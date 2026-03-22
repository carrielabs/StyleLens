-- 创建存储提取记录的表
CREATE TABLE IF NOT EXISTS public.style_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_label TEXT,
    thumbnail_url TEXT,
    style_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 安全策略启用 (Row Level Security)
ALTER TABLE public.style_records ENABLE ROW LEVEL SECURITY;

-- 只有用户自己可以查看自己的记录
CREATE POLICY "Users can view their own records"
ON public.style_records FOR SELECT
USING ( auth.uid() = user_id );

-- 只有用户自己可以插入记录
CREATE POLICY "Users can insert their own records"
ON public.style_records FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- 只有用户自己可以更新（例如收藏、修改名称等）自己的记录
CREATE POLICY "Users can update their own records"
ON public.style_records FOR UPDATE
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- 只有用户自己可以删除记录
CREATE POLICY "Users can delete their own records"
ON public.style_records FOR DELETE
USING ( auth.uid() = user_id );

-- 性能索引：加速按用户查询和时间排序
CREATE INDEX IF NOT EXISTS idx_style_records_user_id ON public.style_records (user_id);
CREATE INDEX IF NOT EXISTS idx_style_records_user_created ON public.style_records (user_id, created_at DESC);
