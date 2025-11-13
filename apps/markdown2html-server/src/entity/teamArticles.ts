import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Team } from "./team";
import { Article } from "./article";

@Entity("team_articles")
export class TeamArticle {
  @PrimaryColumn()
  teamId: number;

  @PrimaryColumn()
  articleId: number;

  @ManyToOne(() => Team, { onDelete: "CASCADE" })
  @JoinColumn({ name: "teamId" })
  team: Team;

  @ManyToOne(() => Article, { onDelete: "CASCADE" })
  @JoinColumn({ name: "articleId" })
  article: Article;
}
