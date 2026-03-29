import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Applicant } from "./Applicant";

@Entity("loans_personal_information")
export class PersonalInformation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ length: 50 })
  mobile!: string;

  @Column({ length: 100, nullable: true })
  email!: string;

  @Column({ name: "condition_accepted", default: false })
  conditionAccepted!: boolean;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  // Beneficial owner
  @Column({ name: "is_beneficial_owner", default: true })
  isBeneficialOwner!: boolean;

  @Column({ name: "beneficial_owner_name", length: 255, nullable: true })
  beneficialOwnerName!: string;

  @Column({ name: "beneficial_owner_national_id", length: 50, nullable: true })
  beneficialOwnerNationalId!: string;

  @Column({ name: "applying_on_behalf_reason", type: "text", nullable: true })
  applyingOnBehalfReason!: string;

  @Column({ name: "relationship_type", length: 50, nullable: true })
  relationshipType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
