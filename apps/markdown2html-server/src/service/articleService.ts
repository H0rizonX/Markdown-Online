// src/service/ArticleServer.ts
import { server } from "../../app";
import { Article } from "../entity/article";
import { database } from "../config/database";
import { Like } from "typeorm";

export interface articleType {
  id: number;
  title: string;
  authorId: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  visibility?: "team" | "personal";
  structure?: Record<string, unknown> | null;
  teamId?: number;
  tags?: string[];
}

export class ArticleService {
  private repo = database.getRepository(Article);
  public async createRoom() {
    return server.createRoom();
  }

  async save(data: Partial<Article>) {
    // 先保存文章
    const savedArticle = await this.repo.save(data);

    // 如果文章有 teamId，则在 team_article 表中创建关联记录
    if (data.teamId) {
      await this.repo.manager.getRepository("team_articles").save({
        article_id: savedArticle.id,
        team_id: data.teamId,
      });
    }

    return await this.repo.findOne({
      where: { id: savedArticle.id },
      relations: ["author", "team"],
    });
  }

  delete(id: number) {
    return this.repo.delete(id);
  }

  async findAllDocuments(authorId: number) {
    return await this.repo.find({
      where: { authorId },
      relations: ["author", "team"],
      order: { createdAt: "DESC" },
    });
  }

  async findMySharedDocuments(authorId: number) {
    return await this.repo
      .createQueryBuilder("article")
      .innerJoin("team_articles", "ta", "ta.articlesId = article.id")
      .leftJoinAndSelect("article.team", "team") // 关联 team 表
      .leftJoinAndSelect("article.author", "author") // 关联 user 表
      .where("article.authorId = :authorId", { authorId })
      .orderBy("article.createdAt", "DESC")
      .getMany();
  }
  async update(id: number, data: Partial<Article>) {
    const result = await this.repo.update(id, data);
    return result;
  }

  // 模糊查询方法
  async search(keyword: string) {
    return this.repo.find({
      where: [
        { title: Like(`%${keyword}%`) }, // 标题模糊匹配
        { content: Like(`%${keyword}%`) }, // 内容模糊匹配
      ],
      order: { createdAt: "DESC" }, // 可选：按创建时间降序
    });
  }
}
