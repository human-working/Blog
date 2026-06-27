import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: "user" })
  role: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: "text", nullable: true })
  verificationToken: string | null;

  @Column({ type: "text", nullable: true })
  refreshToken: string | null;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ type: "varchar", nullable: true })
  mfaCode: string | null;

  @Column({ type: "timestamp", nullable: true })
  mfaCodeExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}