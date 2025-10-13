// src/service/UserService.ts
import { database } from "../config/database";
import { Users } from "../entity/user";

export class UserService {
  private repo = database.getRepository(Users);

  findAll() {
    return this.repo.find();
  }

  create(data: Partial<Users>) {
    return this.repo.save(data);
  }

  // 做注销使用 || 踢出房间
  delete(id: number) {
    return this.repo.delete(id);
  }

  async update(id: number, data: Partial<Users>) {
    const result = await this.repo.update(id, data);
    return result;
  }

  async getUser(identifier: number | string) {
    let user;
    if (typeof identifier === "number") {
      user = await this.repo.findOne({ where: { id: identifier } });
    } else {
      user = await this.repo.findOne({ where: { email: identifier } });
    }

    if (!user) {
      return null;
    }
    return user;
  }
}
