import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class PostLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column()
  userId: number; 

  // GEO DATA

  @Column({ type: "varchar", nullable: true })
  country: string | null;

  @Column({ type: "varchar", nullable: true })
  city: string | null;

  @Column({ type: "varchar", nullable: true })
  region: string | null;

  @Column({ type: "float", nullable: true })
  latitude: number | null;

  @Column({ type: "float", nullable: true })
  longitude: number | null;

  @CreateDateColumn()
  likedAt: Date;
}