import axios from "axios";
import { AppDataSource } from "../config/database";
import { GOSIRecord } from "../entities/GOSIRecord";
import { GOSILog } from "../entities/GOSILog";

const DAKHLI_APP_ID = process.env.DAKHLI_APP_ID || "";
const DAKHLI_APP_KEY = process.env.DAKHLI_APP_KEY || "";
const DAKHLI_PLATFORM_KEY = process.env.DAKHLI_PLATFORM_KEY || "";
const DAKHLI_ORGANIZATION_NUMBER = process.env.DAKHLI_ORGANIZATION_NUMBER || "";

const GOV_APP_ID = process.env.GOV_APP_ID || "";
const GOV_APP_KEY = process.env.GOV_APP_KEY || "";
const GOV_PLATFORM_KEY = process.env.GOV_PLATFORM_KEY || "";
const GOV_ORGANIZATION_NUMBER = process.env.GOV_ORGANIZATION_NUMBER || "";

const gosiRepo = AppDataSource.getRepository(GOSIRecord);
const gosiLogRepo = AppDataSource.getRepository(GOSILog);

export interface GOSIData {
  fullName: string;
  basicWage: number;
  housingAllowance: number;
  otherAllowance: number;
  employerName: string;
  workingMonths: string;
  employmentStatus: string;
}

// ── Fetch GOSI data (private sector via Dakhli, gov fallback) ─
export async function fetchDakhliData(
  nationalId: string,
  birthDate: string,
  financeType: string,
  userIp: string
): Promise<{ success: boolean; data?: GOSIData; message?: string }> {
  // Check DB cache first
  const cached = await gosiRepo.findOne({ where: { nationalId, financeType } });
  if (cached) {
    return {
      success: true,
      data: {
        fullName: cached.fullName,
        basicWage: cached.basicWage,
        housingAllowance: cached.housingAllowance,
        otherAllowance: cached.otherAllowance,
        employerName: cached.employerName,
        workingMonths: cached.workingMonths,
        employmentStatus: cached.employmentStatus,
      },
    };
  }

  // ── GOSI (private sector) ──
  const gosiUrl = `https://dakhli.api.elm.sa/api/v1/gosi/income/${nationalId}`;
  const gosiHeaders = {
    "APP-ID": DAKHLI_APP_ID,
    "APP-KEY": DAKHLI_APP_KEY,
    "PLATFORM-KEY": DAKHLI_PLATFORM_KEY,
    "ORGANIZATION-NUMBER": DAKHLI_ORGANIZATION_NUMBER,
    "Content-Type": "text/plain",
  };

  let rawData: any = null;
  let normalized: GOSIData | null = null;

  try {
    const gosiRes = await axios.get(gosiUrl, { headers: gosiHeaders });
    rawData = gosiRes.data;

    // Error code 3-206 means "no salary in GOSI" → try government API
    if (rawData?.errorCode === "3-206") {
      const govResult = await fetchGovernmentPayslip(
        nationalId, birthDate, financeType, userIp
      );
      return govResult;
    }

    if (gosiRes.status === 200 && rawData?.employmentStatusInfo?.length) {
      const d = rawData.employmentStatusInfo[0];
      normalized = {
        fullName: d.fullName ?? "",
        basicWage: parseFloat(d.basicWage ?? 0),
        housingAllowance: parseFloat(d.housingAllowance ?? 0),
        otherAllowance: parseFloat(d.otherAllowance ?? 0),
        employerName: d.employerName ?? "",
        workingMonths: d.workingMonths ?? "",
        employmentStatus: d.employmentStatus ?? "",
      };
    } else {
      await logGosi(userIp, nationalId, financeType, rawData);
      return {
        success: false,
        message: rawData?.errorMessage || "Error from Dakhli API",
      };
    }
  } catch (err: any) {
    rawData = err.response?.data ?? {};
    await logGosi(userIp, nationalId, financeType, rawData);
    return { success: false, message: "Something went wrong connecting to Dakhli API" };
  }

  await logGosi(userIp, nationalId, financeType, rawData);

  // Save to DB
  await gosiRepo.save(
    gosiRepo.create({
      userIp,
      nationalId,
      financeType,
      fullName: normalized.fullName,
      basicWage: normalized.basicWage,
      housingAllowance: normalized.housingAllowance,
      otherAllowance: normalized.otherAllowance,
      employerName: normalized.employerName,
      workingMonths: normalized.workingMonths,
      employmentStatus: normalized.employmentStatus,
    })
  );

  return { success: true, data: normalized };
}

// ── Government Payslip fallback ───────────────────────────────
async function fetchGovernmentPayslip(
  nationalId: string,
  birthDate: string,
  financeType: string,
  userIp: string
): Promise<{ success: boolean; data?: GOSIData; message?: string }> {
  const govUrl = `https://dakhli.api.elm.sa/api/v1/goverment/payslip?id=${nationalId}&birthDate=${birthDate}`;
  const govHeaders = {
    "APP-ID": GOV_APP_ID,
    "APP-KEY": GOV_APP_KEY,
    "PLATFORM-KEY": GOV_PLATFORM_KEY,
    "ORGANIZATION-NUMBER": GOV_ORGANIZATION_NUMBER,
    "REQUEST-REASON": "loan",
    "Content-Type": "text/plain",
  };

  let rawData: any = {};

  try {
    const res = await axios.get(govUrl, { headers: govHeaders });
    rawData = res.data;

    if (res.status === 200 && rawData?.data?.length) {
      const d = rawData.data[0];
      const personal = d.personalInfo ?? {};
      const employer = d.employerInfo ?? {};
      const payslip = d.payslipInfo ?? {};

      const normalized: GOSIData = {
        fullName: personal.employeeNameAr ?? "",
        basicWage: parseFloat(payslip.basicSalary ?? 0),
        housingAllowance: 0,
        otherAllowance: parseFloat(payslip.totalAllownces ?? 0),
        employerName: employer.agencyName ?? "",
        workingMonths: "",
        employmentStatus: "نشط",
      };

      await logGosi(userIp, nationalId, financeType, rawData);

      await gosiRepo.save(
        gosiRepo.create({
          userIp,
          nationalId,
          financeType,
          ...normalized,
        })
      );

      return { success: true, data: normalized };
    }

    await logGosi(userIp, nationalId, financeType, rawData);
    return {
      success: false,
      message: rawData?.errorMessage || "Government API error",
    };
  } catch (err: any) {
    rawData = err.response?.data ?? {};
    await logGosi(userIp, nationalId, financeType, rawData);
    return { success: false, message: "Something went wrong connecting to Government API" };
  }
}

async function logGosi(
  userIp: string,
  nationalId: string,
  financeType: string,
  data: any
): Promise<void> {
  await gosiLogRepo.save(
    gosiLogRepo.create({
      userIp,
      nationalId,
      requestType: "Dakhli API request",
      financeType,
      response: data ? JSON.stringify(data) : undefined,
    })
  );
}
