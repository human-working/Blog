import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Reply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  content: string;

  @Column()
  authorId: number;

  @Column()
  authorUsername: string;

  @Column()
  postId: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: false })
  isAiGenerated: boolean;

  @Column({ default: false })
  isHidden: boolean;
  
  @Column({ default: false })
  hasMedia: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}