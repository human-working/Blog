import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Flag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reportedBy: number;

  @Column({ type: "text" })
  reason: string;

  @Column()
  targetType: string; 

  @Column()
  targetId: number; 

  @Column({ default: "pending" })
  status: string; // "pending" | "reviewed" | "dismissed" | "actioned"

  @Column({ type: "text", nullable: true })
  moderatorNote: string | null;

  @Column({ type: "int", nullable: true })
  reviewedBy: number | null; 

  @CreateDateColumn()
  createdAt: Date;
}