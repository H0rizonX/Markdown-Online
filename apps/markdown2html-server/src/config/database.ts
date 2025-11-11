import "reflect-metadata";
import { DataSource } from "typeorm";
import { Users } from "../entity/user";
import { Article } from "../entity/article";
import { Team } from "../entity/team";

export const database = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "123456",
  database: "markdown",
  synchronize: true,
  logging: false,
  entities: [Users, Article, Team],
});
