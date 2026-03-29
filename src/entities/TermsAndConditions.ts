// ─────────────────────────────────────────────────────────
//  entities/TermsAndConditions.ts
// ─────────────────────────────────────────────────────────
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity("loans_terms_and_conditions")
export class TermsAndConditions {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: true })
  text!: string;

  @Column({ name: "text_ar", type: "text", nullable: true })
  textAr!: string;

  @Column({ name: "is_required", default: true })
  isRequired!: boolean;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "is_mobile", default: false })
  isMobile!: boolean;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", nullable: true })
  updatedAt!: Date;

  @Column({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date;
}
