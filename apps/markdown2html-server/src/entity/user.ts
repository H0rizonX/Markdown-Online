import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Article } from "./article";
@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  avatar: string;

  @Column()
  password: string;

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];
}
