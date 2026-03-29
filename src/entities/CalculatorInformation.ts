import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Applicant } from "./Applicant";

@Entity("loans_calculator_information")
export class CalculatorInformation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "finance_amount", type: "float", nullable: true })
  financeAmount!: number;

  @Column({ length: 255, nullable: true })
  tenure!: string;

  @Column({ type: "int", nullable: true })
  apr!: number;

  @Column({ name: "monthly_installment", type: "float", nullable: true })
  monthlyInstallment!: number;

  @Column({ name: "interest_rate", type: "float", nullable: true })
  interestRate!: number;

  @Column({ name: "interest_amount", type: "float", nullable: true })
  interestAmount!: number;

  @Column({ name: "insurance_rate", type: "float", nullable: true })
  insuranceRate!: number;

  @Column({ name: "insurance_amount", type: "float", nullable: true })
  insuranceAmount!: number;

  @Column({ type: "float", nullable: true })
  fees!: number;

  @Column({ type: "float", nullable: true })
  vat!: number;

  @Column({ name: "total_agreement", type: "float", nullable: true })
  totalAgreement!: number;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
