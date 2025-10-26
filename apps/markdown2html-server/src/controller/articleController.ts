import express, { Response, Request } from "express";
import { ArticleService } from "../service/aritcleService";

const router = express.Router();
const articleService = new ArticleService();

router.get("/link", async (req: Request, res: Response) => {
  await articleService.openLink();
  return res.suc("连接已启动");
});

export default router;
