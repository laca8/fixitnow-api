import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Applicant } from "./Applicant";

@Entity("iban_verification")
export class IBANVerification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "national_id", length: 10 })
  nationalId!: string;

  @Column({ length: 34 })
  iban!: string;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "bank_name_en", length: 255, nullable: true })
  bankNameEn!: string;

  @Column({ name: "bank_name_ar", length: 255, nullable: true })
  bankNameAr!: string;

  @Column({ name: "bank_code", length: 10, nullable: true })
  bankCode!: string;

  @Column({ name: "swift_code", length: 20, nullable: true })
  swiftCode!: string;

  @Column({ name: "account_status", length: 20 })
  accountStatus!: string;

  @Column({ name: "iban_verified", default: false })
  ibanVerified!: boolean;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
