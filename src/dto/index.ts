import {
  IsString, IsNotEmpty, IsIn, Length, IsOptional,
  IsEmail, IsBoolean, IsNumber, IsDateString,
  IsArray, IsInt, Min, Max, ValidateIf,
  Matches, IsUUID,
} from "class-validator";

// ── Shared base ─────────────────────────────────────────────
export class NationalIdAndLanguageDto {
  @IsString()
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/, { message: "national_id must be 10 digits starting with 1 or 2" })
  nationalId!: string;

  @IsIn(["ar", "en"])
  language!: string;
}

// ── Terms ────────────────────────────────────────────────────
export class SelectedTermsDto {
  @IsArray()
  @IsInt({ each: true })
  selectedOptions!: number[];

  @IsIn(["ar", "en"])
  language!: string;
}

// ── ID Verification ──────────────────────────────────────────
export class IDVerificationDto extends NationalIdAndLanguageDto {
  @IsDateString()
  birthdate!: string;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

// ── Status Check ─────────────────────────────────────────────
export class StatusCheckDto extends NationalIdAndLanguageDto {
  @IsUUID()
  transactionId!: string;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;
}

// ── Tahaqq ───────────────────────────────────────────────────
export class TahaqqDto extends NationalIdAndLanguageDto {
  @Matches(/^966\d{9}$/, { message: "Mobile must be KSA format: 966XXXXXXXXX" })
  mobile!: string;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;
}

// ── OTP ──────────────────────────────────────────────────────
export class SendMobileOtpDto extends NationalIdAndLanguageDto {
  @Matches(/^966\d{9}$/)
  mobile!: string;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;
}

export class ConfirmMobileOtpDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @Length(4, 4)
  @Matches(/^\d{4}$/)
  otp!: string;

  @IsIn(["ar", "en"])
  language!: string;
}

export class SendEmailOtpDto extends NationalIdAndLanguageDto {
  @IsEmail()
  email!: string;
}

export class ConfirmEmailOtpDto extends ConfirmMobileOtpDto {}

// ── Personal Information ─────────────────────────────────────
export class PersonalInformationDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @Matches(/^966\d{9}$/)
  mobile!: string;

  @IsEmail()
  email!: string;

  @IsBoolean()
  conditionAccepted!: boolean;

  @IsIn(["ar", "en"])
  language!: string;

  @IsString()
  deviceId!: string;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;

  @IsBoolean()
  isBeneficialOwner!: boolean;

  @ValidateIf((o) => o.isBeneficialOwner === false)
  @IsString()
  @IsNotEmpty()
  beneficialOwnerName?: string;

  @ValidateIf((o) => o.isBeneficialOwner === false)
  @Length(10, 10)
  beneficialOwnerNationalId?: string;

  @ValidateIf((o) => o.isBeneficialOwner === false)
  @IsString()
  @IsNotEmpty()
  applyingOnBehalfReason?: string;

  @ValidateIf((o) => o.isBeneficialOwner === false)
  @IsString()
  @IsNotEmpty()
  relationshipType?: string;
}

// ── Job Information ──────────────────────────────────────────
export class JobInformationDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @IsString()
  jobStatus!: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsString()
  @IsOptional()
  jobType?: string;

  @IsString()
  @IsOptional()
  workField?: string;

  @IsString()
  @IsOptional()
  subWorkField?: string;

  @IsString()
  @IsOptional()
  residentialType?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;

  @IsDateString()
  @IsOptional()
  jobDate?: string;

  @IsString()
  cityAr!: string;

  @IsString()
  cityEn!: string;

  @IsString()
  regionAr!: string;

  @IsString()
  regionEn!: string;

  @IsInt()
  cityId!: number;

  @IsInt()
  regionId!: number;

  @IsIn(["ar", "en"])
  language!: string;

  @IsString()
  deviceId!: string;
}

// ── GOSI ─────────────────────────────────────────────────────
export class GOSIDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @IsIn(["ar", "en"])
  language!: string;

  @IsDateString()
  birthdate!: string;

  @IsString()
  @IsOptional()
  financeType?: string;
}

// ── Income Information ────────────────────────────────────────
export class IncomeInformationDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @IsNumber()
  @Min(0)
  totalMonthlyIncome!: number;

  @IsNumber()
  @Min(0)
  annualAdditionalIncome!: number;

  @IsString()
  @IsOptional()
  sourceOfAnnualAdditionalIncome?: string;

  @IsNumber()
  @Min(0)
  educationalExpenses!: number;

  @IsNumber()
  @Min(100)
  transportationExpenses!: number;

  @IsNumber()
  @Min(30)
  healthExpenditures!: number;

  @IsNumber()
  @Min(60)
  communicationExpenses!: number;

  @IsNumber()
  @Min(75)
  foodExpenses!: number;

  @IsNumber()
  @Min(0)
  otherExpenses!: number;

  @IsNumber()
  @Min(0)
  monthlyCreditObligations!: number;

  @IsBoolean()
  existingMortgage!: boolean;

  @ValidateIf((o) => o.existingMortgage === true)
  @IsBoolean()
  mortgageSupported?: boolean;

  @ValidateIf((o) => o.existingMortgage === true && o.mortgageSupported === true)
  @IsNumber()
  @Min(0)
  supportedValue?: number;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;

  @IsIn(["ar", "en"])
  language!: string;

  @IsString()
  deviceId!: string;
}

// ── Calculator ────────────────────────────────────────────────
export class CalculatorDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @IsNumber()
  financeAmount!: number;

  @IsInt()
  tenure!: number;

  @IsNumber()
  apr!: number;

  @IsNumber()
  monthlyInstallment!: number;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;

  @IsIn(["ar", "en"])
  language!: string;

  @IsString()
  deviceId!: string;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsNumber()
  @IsOptional()
  interestAmount?: number;

  @IsNumber()
  @IsOptional()
  insuranceRate?: number;

  @IsNumber()
  @IsOptional()
  insuranceAmount?: number;

  @IsNumber()
  @IsOptional()
  fees?: number;

  @IsNumber()
  @IsOptional()
  vat?: number;

  @IsNumber()
  @IsOptional()
  totalAgreement?: number;
}

// ── KnowUs ────────────────────────────────────────────────────
export class KnowUsDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @IsString()
  branch!: string;

  @IsString()
  @IsOptional()
  salesPersonCode?: string;

  @IsString()
  howDidYouKnowAboutUs!: string;

  @IsBoolean()
  workRelations!: boolean;

  @ValidateIf((o) => o.workRelations === true)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf((o) => o.workRelations === true)
  @IsString()
  @IsNotEmpty()
  kinship?: string;

  @IsBoolean()
  politicallyExposedPerson!: boolean;

  @ValidateIf((o) => o.politicallyExposedPerson === true)
  @IsString()
  @IsNotEmpty()
  politicallyExposedText?: string;

  @IsIn(["DebtPurchase", "FixitNow"])
  financeType!: string;

  @IsIn(["ar", "en"])
  language!: string;

  @IsString()
  deviceId!: string;
}

// ── FinalStep ─────────────────────────────────────────────────
export class FinalStepDto {
  @Length(10, 10)
  @Matches(/^[12]\d{9}$/)
  nationalId!: string;

  @IsInt()
  maintenanceCenter!: number;

  @IsIn(["ar", "en"])
  language!: string;

  @IsString()
  deviceId!: string;
  // file comes from multer
}

// ── IBAN ──────────────────────────────────────────────────────
export class IBANVerificationDto {
  @IsString()
  @Length(1, 34)
  iban!: string;

  @Length(10, 10)
  nationalId!: string;

  @IsIn(["ar", "en"])
  language!: string;

  @IsString()
  deviceId!: string;

  @IsIn(["DebtPurchase"])
  financeType!: string;
}
