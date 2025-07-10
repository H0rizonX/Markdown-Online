// src/service/UserService.ts
import { database } from "../db";
import { Users } from "../entity/user";

export class UserService {
  private repo = database.getRepository(Users);

  findAll() {
    return this.repo.find();
  }

  create(data: Partial<Users>) {
    return this.repo.save(data);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
  async login(identifier: number | string) {
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
