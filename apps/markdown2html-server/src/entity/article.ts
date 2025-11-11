import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Users } from "./user";
import { Team } from "./team";

@Entity({ name: "articles" })
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  title: string; // 文章标题

  @Column({ type: "text" })
  content: string; // 文章内容

  @Column()
  authorId: number; // 外键关联用户 ID

  @ManyToOne(() => Users, (user) => user.articles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author: Users;

  // 团队外键，可为空（个人文章无团队）
  @ManyToOne(() => Team, (team) => team.articles, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "teamId" })
  team: Team | null;

  @Column({ nullable: true })
  teamId: number | null;

  @Column({ type: "enum", enum: ["team", "personal"], default: "personal" })
  visibility: "team" | "personal";

  @Column({ type: "json", nullable: true })
  structure: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
