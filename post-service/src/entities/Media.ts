import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  type: string; // "image" | "video"

  @Column()
  filename: string;

  @Column()
  mimetype: string;
  
  @Column({ default: false })
  isHidden: boolean;

  @Column()
  size: number;

  @Column()
  uploadedBy: number; // authorId
  
  @Column({ type: "int", nullable: true })
  postId: number | null;
  
  @Column({ type: "int", nullable: true })
  replyId: number | null; 

  @CreateDateColumn()
  uploadedAt: Date;
}