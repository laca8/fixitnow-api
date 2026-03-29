import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Applicant } from "./Applicant";

@Entity("loans_finalstep_information")
export class FinalStepInformation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "maintenance_center_id", type: "int", nullable: true })
  maintenanceCenterId!: number;

  @Column({ length: 500 })
  file!: string;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
