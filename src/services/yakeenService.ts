import axios from "axios";
import { AppDataSource } from "../config/database";
import { YakeenUserData } from "../entities/YakeenUserData";
import { YakeenLog } from "../entities/YakeenLog";
import { cacheGet, cacheSet } from "../utils/helpers";

const YAKERN_USERNAME = process.env.YAKERN_USERNAME || "";
const YAKERN_PASSWORD = process.env.YAKERN_PASSWORD || "";
const YAKERN_APP_ID   = process.env.YAKERN_APP_ID   || "";
const YAKERN_APP_KEY  = process.env.YAKERN_APP_KEY  || "";

const YAKEEN_BASE = "https://yakeencore.api.elm.sa/api/v1/yakeen";

const yakeenRepo = AppDataSource.getRepository(YakeenUserData);
const yakeenLog  = AppDataSource.getRepository(YakeenLog);

// ── Login to Yakeen ───────────────────────────────────────────
export async function yakeenLogin(
  userIp: string,
  financeType: string
): Promise<{ success: boolean; token?: string; message?: string }> {
  // Check cache first
  const cached = cacheGet<string>("yakeen_accesstoken");
  if (cached) return { success: true, token: cached };

  const url = `${YAKEEN_BASE}/login?username=${YAKERN_USERNAME}&password=${YAKERN_PASSWORD}`;
  const headers = {
    "app-id":  YAKERN_APP_ID,
    "app-key": YAKERN_APP_KEY,
    "Content-Type": "application/json",
  };

  try {
    const res = await axios.get(url, { headers });
    const output = res.data;

    await yakeenLog.save(
      yakeenLog.create({
        userIp,
        requestType: "Authentication API request",
        financeType,
        response: JSON.stringify(output),
      })
    );

    if (res.status === 200 && output.access_token) {
      // Calculate TTL from expires_on
      const expiresOn = new Date(output.expires_on).getTime();
      const now = Date.now();
      const ttl = Math.floor((expiresOn - now) / 1000);
      cacheSet("yakeen_accesstoken", output.access_token, ttl > 0 ? ttl : 300);
      return { success: true, token: output.access_token };
    }

    return { success: false, message: output.error || "Yakeen login failed" };
  } catch (err: any) {
    const output = err.response?.data;
    await yakeenLog.save(
      yakeenLog.create({
        userIp,
        requestType: "Authentication API request",
        financeType,
        response: JSON.stringify(output ?? {}),
      })
    );
    return { success: false, message: output?.error || "Connection error" };
  }
}

// ── Get person data from Yakeen ───────────────────────────────
export async function yakeenGetData(
  nationalId: string,
  birthdate: string,
  token: string,
  userIp: string,
  financeType: string
): Promise<{ success: boolean; data?: any; message?: string }> {
  // birthdate comes as YYYY-MM-DD, yakeen needs YYYY-MM
  const birthdateMonth = birthdate.substring(0, 7);
  const isSaudi = nationalId[0] === "1";

  const serviceIdentifier = isSaudi
    ? "1c265a77-fdf0-436c-9e55-a50658d2d7df"
    : "0f7a7e12-119f-4b46-957e-b21538ca4138";

  const param = isSaudi
    ? `nin=${nationalId}&dateString=${birthdateMonth}`
    : `iqama=${nationalId}&birthDateG=${birthdateMonth}`;

  const url = `${YAKEEN_BASE}/data?${param}`;

  const headers = {
    "usage-code":          "USC60005",
    Authorization:         `Bearer ${token}`,
    "operator-id":         nationalId,
    "service-identifier":  serviceIdentifier,
    "app-id":              YAKERN_APP_ID,
    "app-key":             YAKERN_APP_KEY,
  };

  try {
    const res = await axios.get(url, { headers });
    const output = res.data;

    await yakeenLog.save(
      yakeenLog.create({
        userIp,
        nationalId,
        birthdate: new Date(birthdate),
        requestType: "Saudi/Non-Saudi data API request",
        financeType,
        response: JSON.stringify(output),
      })
    );

    if (res.status === 200) return { success: true, data: output };
    return {
      success: false,
      message: output?.errorDetail?.errorMessage || "Yakeen data error",
    };
  } catch (err: any) {
    const output = err.response?.data;
    await yakeenLog.save(
      yakeenLog.create({
        userIp,
        nationalId,
        birthdate: new Date(birthdate),
        requestType: "Saudi/Non-Saudi data API request",
        financeType,
        response: JSON.stringify(output ?? {}),
      })
    );
    return {
      success: false,
      message: output?.errorDetail?.errorMessage || "Connection error",
    };
  }
}

// ── Verify birthdate and save user data ───────────────────────
export async function verifyAndSaveYakeenData(
  nationalId: string,
  birthdate: string,
  userIp: string,
  financeType: string
): Promise<{ success: boolean; message?: string }> {
  // Already verified for this national_id + birthdate combo?
  const exists = await yakeenRepo.findOne({
    where: { userId: nationalId, birthdate: new Date(birthdate), financeType },
  });
  if (exists) return { success: true };

  // Login
  const loginResult = await yakeenLogin(userIp, financeType);
  if (!loginResult.success || !loginResult.token) {
    return { success: false, message: loginResult.message };
  }

  // Get data
  const dataResult = await yakeenGetData(
    nationalId,
    birthdate,
    loginResult.token,
    userIp,
    financeType
  );
  if (!dataResult.success || !dataResult.data) {
    return { success: false, message: dataResult.message };
  }

  const p = dataResult.data.personBasicInfo;
  const nameEn = `${p.firstNameT} ${p.fatherNameT} ${p.grandFatherNameT} ${p.familyNameT}`;
  const nameAr = `${p.firstName} ${p.fatherName} ${p.grandFatherName} ${p.familyName}`;

  await yakeenRepo.save(
    yakeenRepo.create({
      userId: nationalId,
      nameAr,
      nameEn,
      birthdate: new Date(birthdate),
      financeType,
    })
  );

  return { success: true };
}

// ── Get saved Yakeen user data ─────────────────────────────────
export async function getYakeenUserData(
  nationalId: string,
  birthdate: string
): Promise<YakeenUserData | null> {
  return yakeenRepo.findOne({
    where: { userId: nationalId, birthdate: new Date(birthdate) },
  });
}
