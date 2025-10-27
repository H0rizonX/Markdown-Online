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

  @ManyToOne(() => Users, (user) => user.articles)
  @JoinColumn({ name: "authorId" })
  author: Users; // 通过关系映射可以查到用户信息

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
