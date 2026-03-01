import { z } from "zod";

export const postSchema = z.object({
  sourceUrl: z.string().url("有効なURLを入力してください"),
  vtuber_id: z.string().uuid("VTuberを選択してください"),
  comment: z
    .string()
    .min(1, "おすすめコメントを入力してください")
    .max(500, "500文字以内で入力してください"),
  rating: z.number().min(1).max(5),
  tags: z.array(z.string()),
  parentPostId: z.string().uuid().optional(),
});

export type PostFormValues = z.infer<typeof postSchema>;
