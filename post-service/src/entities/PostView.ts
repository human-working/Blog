import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class PostView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column({ nullable: true, type: "int" })
  userId: number | null; // null if not logged in

  @Column({ type: "varchar", nullable: true })
  ipHash: string | null; // hashed IP for anonymous views

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
  viewedAt: Date;
}