// src/service/TeamServer.ts
import { Team } from "../entity/team";
import { database } from "../config/database";
import { Users } from "../entity/user";

export interface teamType {
  id: number;
  name: string;
  ownerId: number;
  owner?: Users;
  members?: Users[];
  tags?: string[];
  description?: string;
}

export class TeamService {
  private repo = database.getRepository(Team);
  save(data: Partial<Team>) {
    return this.repo.save(data);
  }

  async delete(teamId: number) {
    return await database.transaction(async (manager) => {
      // 1. 查出所有该 team 下的 articleId
      const articleIds = await manager
        .createQueryBuilder()
        .select("ta.articleId", "articleId")
        .from("team_articles", "ta")
        .where("ta.teamId = :teamId", { teamId })
        .getRawMany();

      const ids = articleIds.map((a) => a.articleId);

      if (ids.length > 0) {
        // 2. 删除 article 表中所有对应的文章
        await manager
          .createQueryBuilder()
          .delete()
          .from("articles")
          .where("id IN (:...ids)", { ids })
          .execute();
      }

      // 3. 删除 team_articles 中关联
      await manager
        .createQueryBuilder()
        .delete()
        .from("team_articles")
        .where("teamId = :teamId", { teamId })
        .execute();

      // 4. 删除 team_user 中关联
      await manager
        .createQueryBuilder()
        .delete()
        .from("team_user")
        .where("teamId = :teamId", { teamId })
        .execute();

      // 5. 删除 team 表自身记录
      await manager.getRepository(Team).delete(teamId);

      return true;
    });
  }

  async findAll(userId: number) {
    return this.repo
      .createQueryBuilder("team")
      .leftJoinAndSelect("team.members", "member", "")
      .where("team.ownerId = :userId", { userId })
      .orWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("team_user.teamId")
          .from("team_user", "team_user")
          .where("team_user.userId = :userId", { userId })
          .getQuery();
        return "team.id IN " + subQuery;
      })
      .getMany();
  }

  async update(id: number, data: Partial<Team>) {
    const result = await this.repo.update(id, data);
    return result;
  }

  //插入用户表
  async addMember(teamId: number, userId: number) {
    // 查团队（同时加载已有成员）
    const team = await this.repo.findOne({
      where: { id: teamId },
      relations: ["members"],
    });

    if (!team) throw new Error("团队不存在");

    // 查用户
    const user = await database.getRepository(Users).findOneBy({ id: userId });
    if (!user) throw new Error("用户不存在");

    // 加入成员
    team.members.push(user);

    // 保存团队，会自动在 team_user 表插入记录
    return this.repo.save(team);
  }

  async leaveTeam(teamId: number, userId: number) {
    return await database.transaction(async (manager) => {
      // 1. 查团队是否存在
      const team = await manager.getRepository(Team).findOneBy({ id: teamId });
      if (!team) throw new Error("团队不存在");

      // 2. 删除该用户在该团队下创建的 article
      await manager
        .createQueryBuilder()
        .delete()
        .from("articles")
        .where("teamId = :teamId AND authorId = :userId", { teamId, userId })
        .execute();

      // 3. 删除 team_user 表中的关联
      const result = await manager
        .createQueryBuilder()
        .delete()
        .from("team_user")
        .where("teamId = :teamId AND userId = :userId", { teamId, userId })
        .execute();

      return result;
    });
  }

  // 查询团队成员
  // 查询团队成员
  async getTeammates(teamId: number) {
    // 先检查团队是否存在
    const team = await this.repo.findOneBy({ id: teamId });
    if (!team) throw new Error("团队不存在");

    // 查询 team_user 中该团队的所有 userId
    const members = await database
      .createQueryBuilder()
      .select("userId")
      .from("team_user", "tu") // 中间表
      .where("teamId = :teamId", { teamId })
      .getRawMany(); // 返回原始数据 [{ userId: 1 }, { userId: 2 }, ...]

    // 完整用户信息
    const userIds = members.map((m) => m.userId);
    if (userIds.length === 0) return [];

    const users = await database
      .getRepository("users")
      .createQueryBuilder("u")
      .where("u.id IN (:...userIds)", { userIds })
      .getMany();

    return users; // 返回团队成员完整信息
  }

  async updateTeam(
    teamId: number,
    data: { name: string; description?: string; tags?: string[] }
  ) {
    const team = await this.repo.findOneBy({ id: teamId });
    if (!team) throw new Error("团队不存在");

    // 更新字段
    team.name = data.name;
    if (data.description !== undefined) team.description = data.description;
    if (data.tags !== undefined) team.tags = data.tags;

    return await this.repo.save(team);
  }
}
