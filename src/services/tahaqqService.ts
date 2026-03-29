import axios from "axios";
import { AppDataSource } from "../config/database";
import { TahaqqRecord } from "../entities/TahaqqRecord";
import { TahaqqLog } from "../entities/TahaqqLog";

const TAHAQQ_URL                 = process.env.TAHAQQ_URL                 || "";
const TAHAQQ_APP_ID              = process.env.TAHAQQ_APP_ID              || "";
const TAHAQQ_APP_KEY             = process.env.TAHAQQ_APP_KEY             || "";
const TAHAQQ_SERVICE_KEY         = process.env.TAHAQQ_SERVICE_KEY         || "";
const TAHAQQ_ORGANIZATION_NUMBER = process.env.TAHAQQ_ORGANIZATION_NUMBER || "";

const tahaqqRepo    = AppDataSource.getRepository(TahaqqRecord);
const tahaqqLogRepo = AppDataSource.getRepository(TahaqqLog);

export async function verifyMobileOwnership(
  nationalId: string,
  mobile: string,
  userIp: string,
  financeType: string
): Promise<{ success: boolean; isOwner?: boolean; message?: string }> {
  const url = `${TAHAQQ_URL}/api/v1/person/${nationalId}/owns-mobile/${mobile}`;

  const headers = {
    "APP-ID":              TAHAQQ_APP_ID,
    "APP-KEY":             TAHAQQ_APP_KEY,
    "SERVICE_KEY":         TAHAQQ_SERVICE_KEY,
    "ORGANIZATION-NUMBER": TAHAQQ_ORGANIZATION_NUMBER,
    "Content-Type":        "text/plain",
  };

  let output: any = {};
  let success = false;
  let message = "";

  try {
    const res = await axios.get(url, { headers });

    if (res.status === 200) {
      output = res.data;
      success = true;
    } else if ([400, 401, 402, 403, 404].includes(res.status)) {
      output = res.data;
      message = output.message || "Tahaqq error";
    } else {
      message = "Error connecting to Tahaqq";
    }
  } catch (err: any) {
    output = err.response?.data ?? {};
    message = output?.message || "Something went wrong connecting to Tahaqq API";
  }

  // Always log
  await tahaqqRepo.save(
    tahaqqRepo.create({ userIp, nationalId, mobile, financeType })
  );
  await tahaqqLogRepo.save(
    tahaqqLogRepo.create({
      userIp,
      nationalId,
      mobile,
      requestType: "Tahaqq mobile Request",
      financeType,
      response: JSON.stringify(output),
    })
  );

  if (!success) return { success: false, message };
  return { success: true, isOwner: output.isOwner === true };
}
