import axios from "axios";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { NafazRequest } from "../entities/NafazRequest";
import { NafazLog } from "../entities/NafazLog";
import { Applicant } from "../entities/Applicant";
import { getClientIp } from "../utils/helpers";

const NAFAZ_URL = process.env.NAFAZ_URL || "";
const NAFAZ_APP_ID = process.env.NAFAZ_APP_ID || "";
const NAFAZ_APP_KEY = process.env.NAFAZ_APP_KEY || "";
const NAFAZ_SERVICE = process.env.NAFAZ_SERVICE || "";

const nafazReqRepo = AppDataSource.getRepository(NafazRequest);
const nafazLogRepo = AppDataSource.getRepository(NafazLog);
const applicantRepo = AppDataSource.getRepository(Applicant);

// ── Send Nafath push notification ─────────────────────────────
export async function nafazUserRequest(
  requestId: string,
  nationalId: string,
  financeType: string,
  deviceId: string,
  userIp: string
): Promise<{ state: boolean; output: any }> {
  const url = `${NAFAZ_URL}/api/v1/mfa/request?local=ar&requestId=${requestId}`;
  const headers = {
    "APP-ID": NAFAZ_APP_ID,
    "APP-KEY": NAFAZ_APP_KEY,
    "content-type": "application/json",
    "cache-control": "no-cache",
  };

  let state = false;
  let output: any = null;

  try {
    const res = await axios.post(url, { nationalId, service: NAFAZ_SERVICE }, { headers });
    output = res.data;
    state = true;
  } catch (err: any) {
    output = err.response?.data ?? null;
  }

  // log
  await nafazLogRepo.save(
    nafazLogRepo.create({
      deviceId,
      nationalId,
      requestId,
      financeType,
      requestType: "Nafaz Absher Request",
      response: output ? JSON.stringify(output) : undefined,
    })
  );

  return { state, output };
}

// ── Handle Nafath JWT callback ────────────────────────────────
export async function handleNafazCallback(
  token: string,
  transId: string,
  requestId: string,
  userIp: string
): Promise<{ status: string; error?: string }> {
  const userdata = await nafazReqRepo.findOne({
    where: { transactionId: transId, requestId },
  });

  let decoded: any;
  try {
    decoded = jwt.decode(token);
  } catch {
    return { status: "fail", error: "Invalid token" };
  }

  if (!decoded) return { status: "fail", error: "Could not decode token" };

  if (userdata) {
    userdata.status = decoded.status;
    await nafazReqRepo.save(userdata);

    if (decoded.status === "COMPLETED") {
      const exists = await applicantRepo.findOne({
        where: {
          nationalId: userdata.nationalId,
          financeType: userdata.financeType,
          deviceId: userdata.deviceId,
        },
      });
      // Only create a new applicant record if none exists beyond step 9
      const hasActive = await applicantRepo
        .createQueryBuilder("a")
        .where("a.nationalId = :nid", { nid: userdata.nationalId })
        .andWhere("a.financeType = :ft", { ft: userdata.financeType })
        .andWhere("a.deviceId = :did", { did: userdata.deviceId })
        .andWhere("a.step != :s", { s: 9 })
        .getOne();

      if (!hasActive) {
        await applicantRepo.save(
          applicantRepo.create({
            nationalId: userdata.nationalId,
            step: 3,
            financeType: userdata.financeType,
            deviceId: userdata.deviceId,
          })
        );
      }
    }
  }

  await nafazLogRepo.save(
    nafazLogRepo.create({
      deviceId: userdata?.deviceId ?? "",
      requestType: "Nafaz Callback",
      response: JSON.stringify({ status: "success" }),
    })
  );

  return { status: "success" };
}

// ── Check Nafath conditions (blacklist, pending, cooldown) ─────
// Note: these hit the Oracle DB via the existing Python layer.
// Here we check the Django-side conditions using MySQL data only.
export async function checkNafazLocalConditions(
  nationalId: string,
  financeType: string
): Promise<{ allowed: boolean; message: string }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentCompleted = await applicantRepo.findOne({
    where: { nationalId, financeType, step: 9 },
    order: { createdAt: "DESC" },
  });

  if (recentCompleted && recentCompleted.createdAt > sevenDaysAgo) {
    const remaining = Math.ceil(
      (recentCompleted.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) /
      (1000 * 60 * 60 * 24)
    );
    return {
      allowed: false,
      message: `You can submit a new loan after ${remaining} day(s).`,
    };
  }

  return { allowed: true, message: "" };
}

// ── Status check ──────────────────────────────────────────────
export async function getNafazStatus(
  nationalId: string,
  transactionId: string,
  financeType: string
): Promise<{ found: boolean; status?: string }> {
  const record = await nafazReqRepo.findOne({
    where: { nationalId, transactionId, financeType },
  });
  if (!record) return { found: false };
  return { found: true, status: record.status };
}
