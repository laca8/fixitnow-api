import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getClientIp, successResponse, errorResponse } from "../utils/helpers";
import { AppDataSource } from "../config/database";
import { NafazRequest } from "../entities/NafazRequest";
import { YakeenUserData } from "../entities/YakeenUserData";

import * as nafazService from "../services/nafazService";
import * as yakeenService from "../services/yakeenService";
import * as tahaqqService from "../services/tahaqqService";
import * as dakhliService from "../services/dakhliService";
import * as leanService from "../services/leanService";
import * as otpService from "../services/otpService";
import * as appService from "../services/appService";
import { isOlderThan19 } from "../utils/helpers";

const nafazRequestRepo = AppDataSource.getRepository(NafazRequest);
const yakeenRepo = AppDataSource.getRepository(YakeenUserData);

// ─────────────────────────────────────────────────────────────
// TERMS
// ─────────────────────────────────────────────────────────────
export async function getTerms(req: Request, res: Response) {
  const isMobile = req.path.includes("mobile");
  const terms = await appService.getActiveTerms(isMobile);
  return successResponse(res, terms);
}

export async function postTerms(req: Request, res: Response) {
  const { selectedOptions, language, isMobile } = req.body;
  const result = await appService.validateSelectedTerms(
    selectedOptions,
    isMobile ?? false,
    language
  );
  if (!result.valid) return errorResponse(res, result.message);
  return successResponse(res, {});
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Identity (Nafath + Yakeen)
// ─────────────────────────────────────────────────────────────
export async function idVerification(req: Request, res: Response) {
  const { nationalId, birthdate, financeType, deviceId, language } = req.body;
  const userIp = getClientIp(req);

  // Age check
  if (!isOlderThan19(birthdate)) {
    return errorResponse(
      res,
      language === "ar" ? "يجب أن يكون العمر فوق 19 سنة" : "Age must be above 19"
    );
  }

  // Local cooldown / 7-day check
  const localCheck = await nafazService.checkNafazLocalConditions(nationalId, financeType);
  if (!localCheck.allowed) return errorResponse(res, localCheck.message);

  // Check if user already has a completed Nafath in last 3 days
  const nafazStep = await appService.getNafazStep(nationalId, financeType, deviceId);

  if (nafazStep.canContinue) {
    // Verify Yakeen birthdate then return step info
    const yResult = await yakeenService.verifyAndSaveYakeenData(
      nationalId, birthdate, userIp, financeType
    );
    if (!yResult.success) return errorResponse(res, yResult.message);

    return successResponse(res, {
      step: nafazStep.step,
      can_continue: true,
      transId: nafazStep.transId ?? "",
    });
  }

  // No existing session → verify Yakeen first, then send Nafath
  const yResult = await yakeenService.verifyAndSaveYakeenData(
    nationalId, birthdate, userIp, financeType
  );
  if (!yResult.success) return errorResponse(res, yResult.message);

  const requestId = uuidv4();
  const { state, output } = await nafazService.nafazUserRequest(
    requestId, nationalId, financeType, deviceId, userIp
  );

  if (!state) {
    return errorResponse(res, output?.message || "Nafath request failed");
  }

  await nafazRequestRepo.save(
    nafazRequestRepo.create({
      deviceId,
      nationalId,
      transactionId: output.transId,
      requestId,
      financeType,
      userIp,
    })
  );

  return successResponse(res, { ...output, can_continue: false });
}

export async function sendIdVerification(req: Request, res: Response) {
  const { nationalId, birthdate, financeType, deviceId } = req.body;
  const userIp = getClientIp(req);

  await appService.resetApplicant(nationalId, financeType, deviceId);

  const yResult = await yakeenService.verifyAndSaveYakeenData(
    nationalId, birthdate, userIp, financeType
  );
  if (!yResult.success) return errorResponse(res, yResult.message);

  return successResponse(res, { can_continue: false });
}

export async function nafathCallback(req: Request, res: Response) {
  const { token, transId, requestId } = req.body;
  const userIp = getClientIp(req);
  const result = await nafazService.handleNafazCallback(token, transId, requestId, userIp);
  return res.json(result);
}

export async function statusCheck(req: Request, res: Response) {
  const { nationalId, transactionId, financeType } = req.query as any;
  const result = await nafazService.getNafazStatus(nationalId, transactionId, financeType);
  if (!result.found) return errorResponse(res, "Record does not exist");
  return successResponse(res, { status: result.status });
}

export async function getYakeenData(req: Request, res: Response) {
  const { nationalId, birthdate } = req.body;
  const data = await yakeenService.getYakeenUserData(nationalId, birthdate);
  if (!data) return errorResponse(res, "No data found for this national id and birthdate");
  return successResponse(res, {
    name_en: data.nameEn || "",
    name_ar: data.nameAr || "",
    birthdate: data.birthdate || "",
  });
}

// ─────────────────────────────────────────────────────────────
// STEP 3 — Tahaqq, OTP, Personal Info
// ─────────────────────────────────────────────────────────────
export async function mobileTahaqq(req: Request, res: Response) {
  const { nationalId, mobile, financeType, language } = req.body;
  const userIp = getClientIp(req);

  const result = await tahaqqService.verifyMobileOwnership(
    nationalId, mobile, userIp, financeType
  );

  if (!result.success) return errorResponse(res, result.message);
  if (!result.isOwner) {
    return errorResponse(
      res,
      language === "ar"
        ? "رقم الجوال غير مرتبط بالهوية الوطنية"
        : "Mobile number is not linked to the national id"
    );
  }
  return successResponse(res, {});
}

export async function sendMobileSms(req: Request, res: Response) {
  const { nationalId, mobile, language } = req.body;
  await otpService.sendMobileOtp(nationalId, mobile, language);
  return successResponse(res, {});
}

export async function confirmMobileOtp(req: Request, res: Response) {
  const { nationalId, otp } = req.body;
  const result = await otpService.confirmMobileOtp(nationalId, otp);
  if (!result.valid) return errorResponse(res, result.message);
  return successResponse(res, {});
}

export async function sendEmailOtp(req: Request, res: Response) {
  const { nationalId, email } = req.body;
  const result = await otpService.sendEmailOtp(nationalId, email);
  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, {});
}

export async function confirmEmailOtp(req: Request, res: Response) {
  const { nationalId, otp } = req.body;
  const result = await otpService.confirmEmailOtp(nationalId, otp);
  if (!result.valid) return errorResponse(res, result.message);
  return successResponse(res, {});
}

export async function getPersonalInfo(req: Request, res: Response) {
  const { nationalId, financeType } = req.query as any;
  const data = await yakeenRepo.find({
    where: { userId: nationalId, financeType },
    order: { createdAt: "DESC" },
  });
  return successResponse(res, data);
}

export async function postPersonalInfo(req: Request, res: Response) {
  const {
    nationalId, financeType, deviceId,
    mobile, email, conditionAccepted,
    isBeneficialOwner, beneficialOwnerName,
    beneficialOwnerNationalId, applyingOnBehalfReason, relationshipType,
  } = req.body;

  const result = await appService.addPersonalInformation(
    nationalId, financeType, deviceId,
    {
      mobile, email, conditionAccepted,
      isBeneficialOwner, beneficialOwnerName,
      beneficialOwnerNationalId, applyingOnBehalfReason, relationshipType,
    }
  );

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, {});
}

// ─────────────────────────────────────────────────────────────
// STEP 4 — Job Information
// ─────────────────────────────────────────────────────────────
export async function postJobInfo(req: Request, res: Response) {
  const {
    nationalId, financeType, deviceId, language,
    jobStatus, sector, jobType, workField, subWorkField,
    residentialType, jobTitle, jobDate,
    cityAr, cityEn, regionAr, regionEn, cityId, regionId,
  } = req.body;

  // Employment duration check
  if (jobDate && jobStatus !== "0") {
    const check = appService.validateEmploymentDuration(nationalId, jobDate, sector, language);
    if (!check.valid) return errorResponse(res, check.message);
  }

  const result = await appService.addJobInformation(nationalId, financeType, deviceId, {
    jobStatus, sector, jobType, workField, subWorkField,
    residentialType, jobTitle,
    jobDate: jobDate ? new Date(jobDate) : undefined,
    cityAr, cityEn, regionAr, regionEn, cityId, regionId,
  });

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, {});
}

// ─────────────────────────────────────────────────────────────
// STEP 5 — GOSI + Income
// ─────────────────────────────────────────────────────────────
export async function getGosiInfo(req: Request, res: Response) {
  const { nationalId, financeType, birthdate } = req.body;
  const userIp = getClientIp(req);

  const result = await dakhliService.fetchDakhliData(
    nationalId, birthdate, financeType, userIp
  );

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, result.data);
}

export async function postIncomeInfo(req: Request, res: Response) {
  const {
    nationalId, financeType, deviceId, language,
    totalMonthlyIncome, annualAdditionalIncome,
    sourceOfAnnualAdditionalIncome, educationalExpenses,
    transportationExpenses, healthExpenditures,
    communicationExpenses, foodExpenses, otherExpenses,
    monthlyCreditObligations, existingMortgage,
    mortgageSupported, supportedValue,
  } = req.body;

  // Income range validation
  const incomeCheck = await appService.validateIncome(nationalId, totalMonthlyIncome, language);
  if (!incomeCheck.valid) return errorResponse(res, incomeCheck.message);

  const result = await appService.addIncomeInformation(nationalId, financeType, deviceId, {
    totalMonthlyIncome, annualAdditionalIncome,
    sourceOfAnnualAdditionalIncome, educationalExpenses,
    transportationExpenses, healthExpenditures,
    communicationExpenses, foodExpenses, otherExpenses,
    monthlyCreditObligations, existingMortgage,
    mortgageSupported, supportedValue,
  });

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, {});
}

// ─────────────────────────────────────────────────────────────
// STEP 6 — Calculator
// ─────────────────────────────────────────────────────────────
export async function postCalculatorInfo(req: Request, res: Response) {
  const {
    nationalId, financeType, deviceId,
    financeAmount, tenure, apr, monthlyInstallment,
    interestRate, interestAmount, insuranceRate,
    insuranceAmount, fees, vat, totalAgreement,
  } = req.body;

  const result = await appService.addCalculatorInformation(nationalId, financeType, deviceId, {
    financeAmount, tenure: String(tenure), apr,
    monthlyInstallment, interestRate, interestAmount,
    insuranceRate, insuranceAmount, fees, vat, totalAgreement,
  });

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, {});
}

// ─────────────────────────────────────────────────────────────
// STEP 7 — Know Us
// ─────────────────────────────────────────────────────────────
export async function postKnowUsInfo(req: Request, res: Response) {
  const {
    nationalId, financeType, deviceId,
    branch, salesPersonCode, howDidYouKnowAboutUs,
    workRelations, name, kinship,
    politicallyExposedPerson, politicallyExposedText,
  } = req.body;

  const result = await appService.addKnowusInformation(nationalId, financeType, deviceId, {
    branch, salesPersonCode, howDidYouKnowAboutUs,
    workRelations, name, kinship,
    politicallyExposedPerson, politicallyExposedText,
  });

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, {});
}

// ─────────────────────────────────────────────────────────────
// STEP 8a — FixItNow Final Step
// ─────────────────────────────────────────────────────────────
export async function postFinalStep(req: Request, res: Response) {
  const { nationalId, maintenanceCenter, language, deviceId } = req.body;
  const file = (req as any).file;

  if (!file) return errorResponse(res, "File is required");

  const result = await appService.addFinalStepInformation(
    nationalId, deviceId, parseInt(maintenanceCenter), file.path, language
  );

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, { applicant_id: result.applicantId });
}

// ─────────────────────────────────────────────────────────────
// STEP 8b — DebtPurchase IBAN Verification
// ─────────────────────────────────────────────────────────────
export async function postIbanVerification(req: Request, res: Response) {
  const { iban, nationalId, language, financeType, deviceId } = req.body;

  const leanResult = await leanService.processIbanVerification(iban, nationalId, language);
  if (!leanResult.success) return errorResponse(res, leanResult.message);

  const d = leanResult.data!;
  const raw = d.raw;
  const bankName = raw.bank_name ?? {};

  const result = await appService.addIbanVerification(
    nationalId, deviceId, financeType,
    {
      iban,
      bankNameEn: bankName?.en ?? "",
      bankNameAr: bankName?.ar ?? "",
      bankCode: raw.bank_code ?? "",
      swiftCode: raw.swift_code ?? "",
      accountStatus: raw.account_status ?? "",
      ibanVerified: raw.iban_ownership_verified ?? false
    }
  );

  if (!result.success) return errorResponse(res, result.message);
  return successResponse(res, { applicant_id: result.applicantId });
}
