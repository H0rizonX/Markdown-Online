import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Users } from "./user";
import { Article } from "./article";

@Entity("teams")
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  // 团队名称
  @Column({ type: "varchar", length: 100, nullable: false })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  // 团队标签数组
  @Column({ type: "simple-array", nullable: true })
  tags: string[];
  // 团队拥有者，一个用户可以创建多个团队
  @ManyToOne(() => Users, (user) => user.ownedTeams, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner: Users;

  @Column()
  ownerId: number;

  // 团队成员，多对多关系
  @ManyToMany(() => Users, (user) => user.joinedTeams, { cascade: true })
  @JoinTable({
    name: "team_user", // 中间表
    joinColumn: { name: "teamId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "userId", referencedColumnName: "id" },
  })
  members: Users[];

  // 团队下的文章
  @OneToMany(() => Article, (article) => article.team)
  articles: Article[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
