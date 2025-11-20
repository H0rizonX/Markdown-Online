// src/service/ArticleServer.ts
import { Article } from "../entity/article";
import { database } from "../config/database";
import { Like } from "typeorm";
import { getCollabServer } from "./collabManager";

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
    const server = getCollabServer();
    if (!server) {
      throw new Error("协同服务未启用");
    }
    return server.createRoom();
  }

  async save(data: Partial<Article>) {
    // 先保存文章
    const savedArticle = await this.repo.save(data);

    // 如果文章有 teamId，则在 team_article 表中创建关联记录
    if (data.teamId) {
      await this.repo.manager.getRepository("team_articles").save({
        articleId: savedArticle.id,
        teamId: data.teamId,
      });
    }

    return await this.repo.findOne({
      where: { id: savedArticle.id },
      relations: ["author", "team"],
    });
  }

  async delete(id: number, userId: number) {
    return await database.transaction(async (manager) => {
      // 查找该用户的文章
      const article = await manager
        .getRepository(Article)
        .findOne({ where: { id, authorId: userId } });

      if (!article) throw new Error("文章不存在或无权限删除");

      // 删除文章记录
      return await manager.getRepository(Article).delete(id);
    });
  }

  async findAllDocuments(authorId: number) {
    // ① 查找用户所在团队
    const teams = await this.repo.manager
      .getRepository("team_user")
      .createQueryBuilder("tu")
      .where("tu.userId = :authorId", { authorId })
      .select("tu.teamId", "teamId")
      .getRawMany();

    const teamIds = teams.map((t) => t.teamId);

    // ② 构造查询：作者自己创建的文档 + 团队文章
    const qb = this.repo
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.author", "author")
      .leftJoinAndSelect("article.team", "team")
      .leftJoin("team_articles", "ta", "ta.articleId = article.id");

    // ③ 条件：作者本人 OR 属于其团队
    if (teamIds.length > 0) {
      qb.where("article.authorId = :authorId", { authorId }).orWhere(
        "ta.teamId IN (:...teamIds)",
        { teamIds }
      );
    } else {
      qb.where("article.authorId = :authorId", { authorId });
    }

    // ④ 排序
    qb.orderBy("article.createdAt", "DESC");

    // ⑤ 执行查询
    return await qb.getMany();
  }

  async findMySharedDocuments(authorId: number) {
    return await this.repo
      .createQueryBuilder("article")
      .innerJoin("team_articles", "ta", "ta.articleId = article.id")
      .leftJoinAndSelect("article.team", "team") // 关联 team 表
      .leftJoinAndSelect("article.author", "author") // 关联 user 表
      .where("article.authorId = :authorId", { authorId })
      .orderBy("article.createdAt", "DESC")
      .getMany();
  }

  async findMyPrivateDocuments(authorId: number) {
    return await this.repo
      .createQueryBuilder("article")
      .leftJoin("team_articles", "ta", "ta.articleId = article.id")
      .leftJoinAndSelect("article.team", "team")
      .leftJoinAndSelect("article.author", "author")
      .where("article.authorId = :authorId", { authorId })
      .andWhere("ta.articleId IS NULL")
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
