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
  const { title, content, authorId, visibility, tags } = doc;
  if (!title || !authorId || !visibility) {
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
      tags,
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
  const articleId = Number(req.params.id);
  const userId = Number(req.query.userId); // 从查询参数获取

  if (!userId) return res.fail("缺少 userId 参数");

  try {
    const data = await articleService.delete(articleId, userId);

    if (data.affected === 0) return res.suc("文章不存在或无权限");
    return res.suc("删除成功");
  } catch (e: unknown) {
    return res.fail(e as Error);
  }
});

router.get("/getDocs", async (req: Request, res: Response) => {
  try {
    const { authorId, type = "all" } = req.query; // type: 'my'  | 'all' | 'shared'

    if (!authorId) {
      return res.fail("authorId 参数必填");
    }

    let data;

    switch (type) {
      case "all":
        // 所有文档 - 所有文档
        data = await articleService.findAllDocuments(+authorId);
        break;

      case "shared":
        // 我的共享文档 - 我创建的团队文档
        data = await articleService.findMySharedDocuments(+authorId);
        break;

      case "my":
        // 我的个人文档-非共享
        data = await articleService.findMyPrivateDocuments(+authorId);
        break;

      default:
        return res.fail("type 参数错误，可选值: my, team, shared, all");
    }

    return res.suc(data);
  } catch (error) {
    console.error("查询文档失败:", error);
    return res.fail("查询文档失败");
  }
});

router.get("/search", async (req: Request, res: Response) => {
  const keyword = req.query.q as string; // 前端传 ?q=关键字
  console.log(keyword, "要模糊查询的关键词");

  const data = await articleService.search(keyword);

  return res.suc(data);
});

export default router;
