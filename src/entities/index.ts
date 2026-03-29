import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from "typeorm";

// ─── NafazRequest ──────────────────────────────────────────
@Entity("fix_it_nafaz_request")
@Index(["nationalId", "userIp"])
export class NafazRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_ip", length: 50 })
  userIp!: string;

  @Column({ name: "national_id", length: 50 })
  nationalId!: string;

  @Column({ name: "transaction_id", length: 36 })
  transactionId!: string;

  @Column({ name: "request_id", length: 36 })
  requestId!: string;

  @Column({ length: 50, default: "WAITING" })
  status!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "device_id", length: 255, nullable: true })
  deviceId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── NafazLog ──────────────────────────────────────────────
@Entity("general_nafaz_log")
export class NafazLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_ip", length: 50 })
  userIp!: string;

  @Column({ name: "national_id", length: 50, nullable: true })
  nationalId!: string;

  @Column({ name: "request_id", length: 36, nullable: true })
  requestId!: string;

  @Column({ name: "request_type", length: 50 })
  requestType!: string;

  @Column({ type: "text", nullable: true })
  response!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @Column({ name: "device_id", length: 255, nullable: true })
  deviceId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── YakeenUserData ────────────────────────────────────────
@Entity("loans_yakeen_user_data")
export class YakeenUserData {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", length: 50 })
  userId!: string;

  @Column({ name: "name_ar", length: 255, nullable: true })
  nameAr!: string;

  @Column({ name: "name_en", length: 255, nullable: true })
  nameEn!: string;

  @Column({ type: "date" })
  birthdate!: Date;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── YakeenLog ─────────────────────────────────────────────
@Entity("general_yakeen_log")
export class YakeenLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_ip", length: 50 })
  userIp!: string;

  @Column({ name: "national_id", length: 50, nullable: true })
  nationalId!: string;

  @Column({ type: "date", nullable: true })
  birthdate!: Date;

  @Column({ name: "request_type", length: 50 })
  requestType!: string;

  @Column({ type: "text", nullable: true })
  response!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── TahaqqRecord ──────────────────────────────────────────
@Entity("loans_tahaqq")
export class TahaqqRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_ip", length: 50, nullable: true })
  userIp!: string;

  @Column({ name: "national_id", length: 50, nullable: true })
  nationalId!: string;

  @Column({ length: 50, nullable: true })
  mobile!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── TahaqqLog ─────────────────────────────────────────────
@Entity("general_tahaqq_log")
export class TahaqqLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_ip", length: 50, nullable: true })
  userIp!: string;

  @Column({ name: "national_id", length: 50, nullable: true })
  nationalId!: string;

  @Column({ length: 50, nullable: true })
  mobile!: string;

  @Column({ type: "text", nullable: true })
  response!: string;

  @Column({ name: "request_type", length: 50 })
  requestType!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── GOSIRecord ────────────────────────────────────────────
@Entity("loans_gosi")
export class GOSIRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_ip", length: 50 })
  userIp!: string;

  @Column({ name: "national_id", length: 50, nullable: true })
  nationalId!: string;

  @Column({ name: "full_name", length: 255, nullable: true })
  fullName!: string;

  @Column({ name: "basic_wage", type: "float", nullable: true })
  basicWage!: number;

  @Column({ name: "housing_allowance", type: "float", nullable: true })
  housingAllowance!: number;

  @Column({ name: "other_allowance", type: "float", nullable: true })
  otherAllowance!: number;

  @Column({ name: "employer_name", length: 255, nullable: true })
  employerName!: string;

  @Column({ name: "working_months", length: 100, nullable: true })
  workingMonths!: string;

  @Column({ name: "employment_status", length: 100, nullable: true })
  employmentStatus!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── GOSILog ───────────────────────────────────────────────
@Entity("general_gosi_log")
export class GOSILog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_ip", length: 50 })
  userIp!: string;

  @Column({ name: "national_id", length: 50, nullable: true })
  nationalId!: string;

  @Column({ name: "request_type", length: 50 })
  requestType!: string;

  @Column({ type: "text", nullable: true })
  response!: string;

  @Column({ name: "finance_type", length: 255, nullable: true })
  financeType!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── OtpLog ────────────────────────────────────────────────
@Entity("otp_log")
export class OtpLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "national_id", length: 50, nullable: true })
  nationalId!: string;

  @Column({ name: "mobile_otp", length: 10, nullable: true })
  mobileOtp!: string;

  @Column({ name: "otytp_type", length: 20, nullable: true })
  otpType!: string;   // 'Mobile' | 'Mail'

  @CreateDateColumn({ name: "date_added" })
  dateAdded!: Date;
}

// ─── MaintenanceCenter ─────────────────────────────────────
@Entity("maintenance_center")
export class MaintenanceCenter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: "name_ar", length: 255, nullable: true })
  nameAr!: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// ─── ErrorLog ──────────────────────────────────────────────
@Entity("error_log")
export class ErrorLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  message!: string;

  @Column({ length: 100, nullable: true })
  module!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
