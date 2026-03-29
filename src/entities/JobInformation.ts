// ─── JobInformation ───────────────────────────────────────
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Applicant } from "./Applicant";

@Entity("loans_job_information")
export class JobInformation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "job_status", length: 255, nullable: true })
  jobStatus!: string;

  @Column({ length: 255, nullable: true })
  sector!: string;

  @Column({ name: "job_type", length: 255, nullable: true })
  jobType!: string;

  @Column({ name: "work_field", length: 255, nullable: true })
  workField!: string;

  @Column({ name: "sub_work_field", length: 255, nullable: true })
  subWorkField!: string;

  @Column({ name: "residential_type", length: 255, nullable: true })
  residentialType!: string;

  @Column({ name: "job_title", length: 255, nullable: true })
  jobTitle!: string;

  @Column({ name: "job_date", type: "date", nullable: true })
  jobDate!: Date;

  @Column({ name: "city_ar", length: 255, nullable: true })
  cityAr!: string;

  @Column({ name: "city_en", length: 255, nullable: true })
  cityEn!: string;

  @Column({ name: "region_ar", length: 255, nullable: true })
  regionAr!: string;

  @Column({ name: "region_en", length: 255, nullable: true })
  regionEn!: string;

  @Column({ name: "city_id", type: "int", nullable: true })
  cityId!: number;

  @Column({ name: "region_id", type: "int", nullable: true })
  regionId!: number;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
