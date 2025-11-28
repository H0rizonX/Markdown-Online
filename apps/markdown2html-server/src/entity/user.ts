import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { Article } from "./article";
import { Team } from "./team";
@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  avatar: string;

  @Column()
  password: string;

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  // 用户创建的团队（拥有者）
  @OneToMany(() => Team, (team) => team.owner)
  ownedTeams: Team[];

  // 用户加入的多个团队
  @ManyToMany(() => Team, (team) => team.members)
  joinedTeams: Team[];
}
