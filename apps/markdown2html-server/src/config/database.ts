import "reflect-metadata";
import { DataSource } from "typeorm";
import { Users } from "../entity/user";
import { Article } from "../entity/article";
import { Team } from "../entity/team";
import { TeamArticle } from "../entity/teamArticles";
import { env } from "./env";

export const database = new DataSource({
  type: "mysql",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: env.db.synchronize,
  logging: env.db.logging,
  entities: [Users, Article, Team, TeamArticle],
});
