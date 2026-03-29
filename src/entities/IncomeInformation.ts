import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Applicant } from "./Applicant";

@Entity("loans_income_information")
export class IncomeInformation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Applicant)
  @JoinColumn({ name: "applicant_id" })
  applicant!: Applicant;

  @Column({ name: "total_monthly_income_after_social_insurance_fees", type: "float", nullable: true })
  totalMonthlyIncome!: number;

  @Column({ name: "annual_additional_income", type: "float", nullable: true })
  annualAdditionalIncome!: number;

  @Column({ name: "source_of_annual_additional_income", length: 255, nullable: true })
  sourceOfAnnualAdditionalIncome!: string;

  @Column({ name: "educational_expenses", type: "float", nullable: true })
  educationalExpenses!: number;

  @Column({ name: "transportation_expenses", type: "float", nullable: true })
  transportationExpenses!: number;

  @Column({ name: "health_expenditures", type: "float", nullable: true })
  healthExpenditures!: number;

  @Column({ name: "communication_expenses", type: "float", nullable: true })
  communicationExpenses!: number;

  @Column({ name: "food_expenses", type: "float", nullable: true })
  foodExpenses!: number;

  @Column({ name: "other_expenses", type: "float", nullable: true })
  otherExpenses!: number;

  @Column({ name: "monthly_credit_obligations", type: "float", nullable: true })
  monthlyCreditObligations!: number;

  @Column({ name: "existing_mortgage", default: false })
  existingMortgage!: boolean;

  @Column({ name: "mortgage_supported", default: false, nullable: true })
  mortgageSupported!: boolean;

  @Column({ name: "supported_value", type: "float", nullable: true })
  supportedValue!: number;

  @Column({ name: "matches_gosi", default: true })
  matchesGosi!: boolean;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "is_deleted", default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
