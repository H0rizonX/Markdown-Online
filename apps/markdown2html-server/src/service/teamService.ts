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
}

export class TeamService {
  private repo = database.getRepository(Team);
  save(data: Partial<Team>) {
    return this.repo.save(data);
  }

  async delete(id: number) {
    //  删除 team_user 表中所有关联
    await database
      .createQueryBuilder()
      .delete()
      .from("team_user") // 直接指定表名
      .where("teamId = :teamId", { teamId: id })
      .execute();

    // 删除 team 表
    return this.repo.delete(id);
  }

  async findAll(userId: number) {
    return this.repo
      .createQueryBuilder("team")
      .leftJoinAndSelect("team.members", "member") // 关联 team_user
      .where("team.ownerId = :userId", { userId })
      .orWhere("member.id = :userId", { userId })
      .orderBy("team.createdAt", "DESC")
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
    // 查团队是否存在
    const team = await this.repo.findOneBy({ id: teamId });
    if (!team) throw new Error("团队不存在");

    //  删除 team_user 表中对应记录
    const result = await database
      .createQueryBuilder()
      .delete()
      .from("team_user")
      .where("teamId = :teamId AND userId = :userId", { teamId, userId })
      .execute();

    return result;
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
}
