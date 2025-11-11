import express, { Response, Request } from "express";
import { ArticleService, articleType } from "../service/articleService";
import { generateShortId } from "../utils";

const router = express.Router();
const articleService = new ArticleService();

router.get("/create", async (req: Request, res: Response) => {
  const data = await articleService.createRoom();
  console.log("用户创建房间");
  return res.suc(data);
});
router.post("/save", async (req: Request, res: Response) => {
  const { doc, team } = req.body;
  const { title, content, authorId, visibility } = doc;
  if (!title || !content || !authorId || !visibility) {
    return res.fail("请确保所有字段不为空");
  }

  const id = Number(generateShortId());

  try {
    const article: articleType = {
      title,
      content,
      authorId,
      id,
      visibility,
      structure: null,
      teamId: team?.id ?? null,
    };
    const data = await articleService.save(article);
    return res.suc(data);
  } catch (error) {
    return res.fail(error);
  }
});

router.put("/update/:id", async (req: Request, res: Response) => {
  try {
    const articleId = +req.params.id;
    const data = await articleService.update(articleId, req.body);
    return res.suc(data);
  } catch (error) {
    console.log(error);
    return res.fail(error);
  }
});

router.delete("/delete/:id", async (req: Request, res: Response) => {
  const articleId = req.params.id;

  const data = await articleService.delete(Number(articleId));

  if (data.affected === 0) return res.suc("文章不存在");
  return res.suc("删除成功");
});

router.get("/myDocs", async (req: Request, res: Response) => {
  const { authorId } = req.body;
  if (!authorId) return res.suc("暂无文章");
  const data = await articleService.findAll(authorId);
  // console.log("日志信息");
  return res.suc(data);
});

router.get("/search", async (req: Request, res: Response) => {
  const keyword = req.query.q as string; // 前端传 ?q=关键字
  console.log(keyword, "要模糊查询的关键词");

  // 调用 service 查询文章
  const data = await articleService.search(keyword);

  return res.suc(data);
});

export default router;
