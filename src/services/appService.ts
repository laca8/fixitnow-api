import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../config/database";
import { Applicant }             from "../entities/Applicant";
import { PersonalInformation }   from "../entities/PersonalInformation";
import { JobInformation }        from "../entities/JobInformation";
import { IncomeInformation }     from "../entities/IncomeInformation";
import { CalculatorInformation } from "../entities/CalculatorInformation";
import { KnowusInformation }     from "../entities/KnowusInformation";
import { FinalStepInformation }  from "../entities/FinalStepInformation";
import { IBANVerification }      from "../entities/IBANVerification";
import { MaintenanceCenter }     from "../entities/MaintenanceCenter";
import { GOSIRecord }            from "../entities/GOSIRecord";
import { NafazRequest }          from "../entities/NafazRequest";
import { TermsAndConditions }    from "../entities/TermsAndConditions";
import { Not, In, MoreThanOrEqual } from "typeorm";

const applicantRepo      = AppDataSource.getRepository(Applicant);
const personalRepo       = AppDataSource.getRepository(PersonalInformation);
const jobRepo            = AppDataSource.getRepository(JobInformation);
const incomeRepo         = AppDataSource.getRepository(IncomeInformation);
const calculatorRepo     = AppDataSource.getRepository(CalculatorInformation);
const knowusRepo         = AppDataSource.getRepository(KnowusInformation);
const finalStepRepo      = AppDataSource.getRepository(FinalStepInformation);
const ibanRepo           = AppDataSource.getRepository(IBANVerification);
const maintenanceRepo    = AppDataSource.getRepository(MaintenanceCenter);
const gosiRepo           = AppDataSource.getRepository(GOSIRecord);
const nafazRequestRepo   = AppDataSource.getRepository(NafazRequest);
const termsRepo          = AppDataSource.getRepository(TermsAndConditions);

// ─────────────────────────────────────────────────────────────
// TERMS
// ─────────────────────────────────────────────────────────────
export async function getActiveTerms(isMobile: boolean) {
  return termsRepo.find({
    where: { isDeleted: false, isActive: true, isMobile },
    order: { createdAt: "DESC" },
  });
}

export async function validateSelectedTerms(
  selectedOptions: number[],
  isMobile: boolean,
  language: "ar" | "en"
): Promise<{ valid: boolean; message?: string }> {
  const all = await termsRepo.find({
    where: { isDeleted: false, isActive: true, isMobile },
    select: ["id", "isRequired"],
  });

  const required  = new Set(all.filter((t) => t.isRequired).map((t) => t.id));
  const available = new Set(all.map((t) => t.id));
  const selected  = new Set(selectedOptions);

  for (const req of required) {
    if (!selected.has(req)) {
      return {
        valid: false,
        message:
          language === "ar"
            ? "يجب تحديد جميع الخيارات المطلوبة"
            : "You must select all required options",
      };
    }
  }

  for (const sel of selected) {
    if (!available.has(sel)) {
      return {
        valid: false,
        message: language === "ar" ? "اختر التحديدات المطلوبة" : "Choose required selections",
      };
    }
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Nafath scenarios
// ─────────────────────────────────────────────────────────────
export async function getNafazStep(
  nationalId: string,
  financeType: string,
  deviceId: string
): Promise<{ step: number | null; canContinue: boolean; transId?: string }> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const existingRecord = await nafazRequestRepo.findOne({
    where: {
      nationalId,
      deviceId,
      financeType,
      status: "COMPLETED",
      createdAt: MoreThanOrEqual(threeDaysAgo),
    },
    order: { createdAt: "DESC" },
  });

  const stepRecord = await applicantRepo.findOne({
    where: {
      nationalId,
      financeType,
      deviceId,
      step: Not(9),
    },
    order: { createdAt: "DESC" },
  });

  if (existingRecord) {
    if (stepRecord) {
      return {
        step: stepRecord.step,
        canContinue: true,
        transId: existingRecord.transactionId,
      };
    }
    return { step: null, canContinue: false };
  }

  return { step: null, canContinue: false };
}

export async function resetApplicant(
  nationalId: string,
  financeType: string,
  deviceId: string
): Promise<void> {
  await applicantRepo.delete({
    nationalId,
    financeType,
    deviceId,
    step: In([2, 3, 4, 5, 6, 7, 8]),
  });
  await applicantRepo.save(
    applicantRepo.create({ nationalId, step: 3, financeType, deviceId })
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 3 — Personal Information
// ─────────────────────────────────────────────────────────────
export async function addPersonalInformation(
  nationalId: string,
  financeType: string,
  deviceId: string,
  data: {
    mobile: string;
    email: string;
    conditionAccepted: boolean;
    isBeneficialOwner: boolean;
    beneficialOwnerName?: string;
    beneficialOwnerNationalId?: string;
    applyingOnBehalfReason?: string;
    relationshipType?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  const applicant = await applicantRepo.findOne({
    where: { nationalId, financeType, deviceId, step: Not(9) },
    order: { createdAt: "DESC" },
  });

  if (!applicant) return { success: false, message: "Applicant does not exist" };
  if (applicant.step > 3) return { success: false, message: "Incorrect Step, kindly refresh the page" };
  if (applicant.step < 3) return { success: false, message: "Incorrect Step, kindly refresh the page" };

  await personalRepo.save(
    personalRepo.create({ applicant, financeType, ...data })
  );

  applicant.step = 4;
  await applicantRepo.save(applicant);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// STEP 4 — Job Information
// ─────────────────────────────────────────────────────────────
export async function addJobInformation(
  nationalId: string,
  financeType: string,
  deviceId: string,
  data: Partial<JobInformation>
): Promise<{ success: boolean; message?: string }> {
  const applicant = await applicantRepo.findOne({
    where: { nationalId, financeType, deviceId, step: Not(9) },
    order: { createdAt: "DESC" },
  });

  if (!applicant) return { success: false, message: "Applicant does not exist" };
  if (applicant.step > 4) return { success: false, message: "Incorrect Step, kindly refresh the page" };
  if (applicant.step < 4) return { success: false, message: "Incorrect Step, kindly refresh the page" };

  await jobRepo.save(jobRepo.create({ applicant, financeType, ...data }));

  applicant.step = 5;
  await applicantRepo.save(applicant);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// STEP 5 — Income Information
// ─────────────────────────────────────────────────────────────
export async function addIncomeInformation(
  nationalId: string,
  financeType: string,
  deviceId: string,
  data: Partial<IncomeInformation>
): Promise<{ success: boolean; message?: string }> {
  const applicant = await applicantRepo.findOne({
    where: { nationalId, financeType, deviceId, step: Not(9) },
    order: { createdAt: "DESC" },
  });

  if (!applicant) return { success: false, message: "Applicant does not exist" };
  if (applicant.step > 5) return { success: false, message: "Incorrect Step, kindly refresh the page" };
  if (applicant.step < 5) return { success: false, message: "Incorrect Step, kindly refresh the page" };

  // Check GOSI match
  let matchesGosi = true;
  const gosiData = await gosiRepo.findOne({ where: { nationalId, financeType } });
  if (gosiData) {
    if (gosiData.basicWage !== data.totalMonthlyIncome) matchesGosi = false;
    if (gosiData.otherAllowance !== data.otherExpenses)  matchesGosi = false;
  }

  await incomeRepo.save(
    incomeRepo.create({ applicant, financeType, matchesGosi, ...data })
  );

  applicant.step = 6;
  await applicantRepo.save(applicant);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// STEP 6 — Calculator
// ─────────────────────────────────────────────────────────────
export async function addCalculatorInformation(
  nationalId: string,
  financeType: string,
  deviceId: string,
  data: Partial<CalculatorInformation>
): Promise<{ success: boolean; message?: string }> {
  const applicant = await applicantRepo.findOne({
    where: { nationalId, financeType, deviceId, step: Not(9) },
    order: { createdAt: "DESC" },
  });

  if (!applicant) return { success: false, message: "Applicant does not exist" };
  if (applicant.step > 6) return { success: false, message: "Incorrect Step, kindly refresh the page" };
  if (applicant.step < 6) return { success: false, message: "Incorrect Step, kindly refresh the page" };

  await calculatorRepo.save(
    calculatorRepo.create({ applicant, financeType, ...data })
  );

  applicant.step = 7;
  await applicantRepo.save(applicant);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// STEP 7 — Know Us
// ─────────────────────────────────────────────────────────────
export async function addKnowusInformation(
  nationalId: string,
  financeType: string,
  deviceId: string,
  data: Partial<KnowusInformation>
): Promise<{ success: boolean; message?: string }> {
  const applicant = await applicantRepo.findOne({
    where: { nationalId, financeType, deviceId, step: Not(9) },
    order: { createdAt: "DESC" },
  });

  if (!applicant) return { success: false, message: "Applicant does not exist" };
  if (applicant.step > 7) return { success: false, message: "Incorrect Step, kindly refresh the page" };
  if (applicant.step < 7) return { success: false, message: "Incorrect Step, kindly refresh the page" };

  await knowusRepo.save(knowusRepo.create({ applicant, financeType, ...data }));

  applicant.step = 8;
  await applicantRepo.save(applicant);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// STEP 8a — FixItNow Final Step
// ─────────────────────────────────────────────────────────────
export async function addFinalStepInformation(
  nationalId: string,
  deviceId: string,
  maintenanceCenterId: number,
  filePath: string,
  language: "ar" | "en"
): Promise<{ success: boolean; applicantId?: number; message?: string }> {
  // Validate maintenance center
  const center = await maintenanceRepo.findOne({ where: { id: maintenanceCenterId } });
  if (!center) {
    return {
      success: false,
      message: language === "ar" ? "مركز الصيانة غير موجود" : "Maintenance center not found",
    };
  }

  const applicant = await applicantRepo.findOne({
    where: { nationalId, financeType: "FixitNow", deviceId, step: Not(9) },
    order: { createdAt: "DESC" },
  });

  if (!applicant) return { success: false, message: "Applicant does not exist" };
  if (applicant.step > 8) return { success: false, message: "Incorrect Step, kindly refresh the page" };
  if (applicant.step < 8) return { success: false, message: "Incorrect Step, kindly refresh the page" };

  await finalStepRepo.save(
    finalStepRepo.create({
      applicant,
      maintenanceCenterId,
      file: filePath,
    })
  );

  const appUuid = uuidv4();
  applicant.step    = 9;
  applicant.appUuid = appUuid;
  await applicantRepo.save(applicant);

  return { success: true, applicantId: applicant.id };
}

// ─────────────────────────────────────────────────────────────
// STEP 8b — DebtPurchase IBAN Verification
// ─────────────────────────────────────────────────────────────
export async function addIbanVerification(
  nationalId: string,
  deviceId: string,
  financeType: string,
  ibanData: {
    iban: string;
    bankNameEn: string;
    bankNameAr: string;
    bankCode: string;
    swiftCode: string;
    accountStatus: string;
    ibanVerified: boolean;
  }
): Promise<{ success: boolean; applicantId?: number; message?: string }> {
  const applicant = await applicantRepo.findOne({
    where: { nationalId, financeType: "DebtPurchase", deviceId, step: Not(9) },
    order: { createdAt: "DESC" },
  });

  if (!applicant) return { success: false, message: "Applicant does not exist" };
  if (applicant.step > 8) return { success: false, message: "Incorrect Step, kindly refresh the page" };
  if (applicant.step < 8) return { success: false, message: "Incorrect Step, kindly refresh the page" };

  await ibanRepo.save(
    ibanRepo.create({
      applicant,
      nationalId,
      financeType,
      ...ibanData,
    })
  );

  const appUuid = uuidv4();
  applicant.step    = 9;
  applicant.appUuid = appUuid;
  await applicantRepo.save(applicant);

  return { success: true, applicantId: applicant.id };
}

// ─────────────────────────────────────────────────────────────
// Employment duration validation
// ─────────────────────────────────────────────────────────────
export function validateEmploymentDuration(
  nationalId: string,
  jobDate: string,
  sector: string,
  language: "ar" | "en"
): { valid: boolean; message?: string } {
  const now      = new Date();
  const jDate    = new Date(jobDate);
  const isSaudi  = nationalId[0] === "1";
  const diffDays = Math.floor((now.getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24));

  if (isSaudi) {
    const isGovMil = sector === "حكومي" || sector === "عسكري";
    const isPrivate = sector === "خاص";

    if (isGovMil && diffDays < 90) {
      return {
        valid: false,
        message:
          language === "ar"
            ? "مدة العمل يجب ألا تقل عن 3 أشهر بالنسبة للسعوديين (القطاع الحكومي والعسكري)"
            : "Employment duration must be at least 3 months for Saudi (Government and military sectors)",
      };
    }
    if (isPrivate && diffDays < 180) {
      return {
        valid: false,
        message:
          language === "ar"
            ? "مدة العمل يجب ألا تقل عن 6 أشهر للسعوديين (القطاع الخاص)"
            : "Employment duration must be at least 6 months for Saudi (Private sector)",
      };
    }
  } else {
    if (diffDays < 365) {
      return {
        valid: false,
        message:
          language === "ar"
            ? "مدة العمل يجب ألا تقل عن سنة واحدة بالنسبة لغير السعوديين"
            : "Employment duration must be at least 1 year for non-Saudi",
      };
    }
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// Income validation
// ─────────────────────────────────────────────────────────────
export async function validateIncome(
  nationalId: string,
  income: number,
  language: "ar" | "en"
): Promise<{ valid: boolean; message?: string }> {
  const jobInfo = await jobRepo.findOne({
    where: { applicant: { nationalId } },
    order: { createdAt: "DESC" },
  });

  const isSaudi   = nationalId[0] === "1";
  const jobStatus = jobInfo?.jobStatus ?? "";

  const min = isSaudi
    ? jobStatus === "0" ? 7000 : 3800   // retired vs employed
    : 6000;                              // non-saudi

  if (income < min) {
    return {
      valid: false,
      message:
        language === "ar" ? `الحد الأدنى هو ${min}` : `minimum is ${min}`,
    };
  }

  if (income > 1000000) {
    return {
      valid: false,
      message: language === "ar" ? "القيمة القصوى 999,999" : "maximum value 999,999",
    };
  }

  return { valid: true };
}
