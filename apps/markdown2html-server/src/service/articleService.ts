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
}

export class ArticleService {
  private repo = database.getRepository(Article);
  public async createRoom() {
    return server.createRoom();
  }

  save(data: Partial<Article>) {
    return this.repo.save(data);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }

  async findAll(authorId: number) {
    return this.repo.find({
      where: {
        authorId, // 根据 authorId 查询
      },
      order: {
        createdAt: "DESC", // 可选：按创建时间倒序
      },
    });
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
