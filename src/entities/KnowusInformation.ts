import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Applicant } from "./Applicant";

@Entity("loans_knowus_information")
export class KnowusInformation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ length: 255, nullable: true })
  branch!: string;

  @Column({ name: "funding_purpose", length: 255, nullable: true })
  fundingPurpose!: string;

  @Column({ name: "sales_person_code", length: 255, nullable: true })
  salesPersonCode!: string;

  @Column({ name: "how_did_you_know_about_us", length: 255, nullable: true })
  howDidYouKnowAboutUs!: string;

  @Column({ name: "work_relations", default: true })
  workRelations!: boolean;

  @Column({ length: 255, nullable: true })
  name!: string;

  @Column({ length: 255, nullable: true })
  kinship!: string;

  @Column({ name: "politically_exposed_person", default: true })
  politicallyExposedPerson!: boolean;

  @Column({ name: "politically_exposed_text", length: 255, nullable: true })
  politicallyExposedText!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
