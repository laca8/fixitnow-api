import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from "typeorm";

@Entity("loans_applicant")
@Index(["nationalId"])
export class Applicant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "national_id", length: 50 })
  nationalId!: string;

  @Column({ name: "user_ip", length: 50, nullable: true })
  userIp!: string;

  @Column({ default: 2 })
  step!: number;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "app_uuid", length: 36, nullable: true, unique: true })
  appUuid!: string;

  @Column({ name: "comp_appl_id", length: 255, nullable: true })
  compApplId!: string;

  @Column({ name: "device_id", length: 255, nullable: true })
  deviceId!: string;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
