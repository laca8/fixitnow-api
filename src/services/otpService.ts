import axios from "axios";
import nodemailer from "nodemailer";
import { AppDataSource } from "../config/database";
import { OtpLog } from "../entities/OtpLog";
import { YakeenUserData } from "../entities/YakeenUserData";
import { cacheGet, cacheSet, cacheDel, generateOtp } from "../utils/helpers";
import { MoreThanOrEqual } from "typeorm";

const otpLogRepo    = AppDataSource.getRepository(OtpLog);
const yakeenRepo    = AppDataSource.getRepository(YakeenUserData);

// ── SMS via external provider ─────────────────────────────────
async function sendSms(message: string, mobile: string): Promise<void> {
  try {
    await axios.post(
      process.env.SMS_API_URL || "",
      { message, mobile, sender: process.env.SMS_SENDER || "AL-TAYSEER" },
      { headers: { Authorization: `Bearer ${process.env.SMS_API_KEY}` } }
    );
  } catch (err) {
    console.error("SMS send error:", err);
  }
}

// ── Send mobile OTP ───────────────────────────────────────────
export async function sendMobileOtp(
  nationalId: string,
  mobile: string,
  language: "ar" | "en"
): Promise<void> {
  const otp = generateOtp();
  cacheSet(`otp_mobile_${nationalId}`, otp, 60);

  await otpLogRepo.save(
    otpLogRepo.create({ nationalId, mobileOtp: otp, otpType: "Mobile" })
  );

  const msg =
    language === "ar"
      ? ` يرجى تأكيد رقم الجوال بإدخال الرمز: ${otp}\r\nلموقع التيسير للتمويل`
      : `Please verify your mobile number by entering the code: ${otp}\r\nTayseer Arabian Company`;

  await sendSms(msg, mobile);
}

// ── Validate mobile OTP ───────────────────────────────────────
export async function validateMobileOtp(
  nationalId: string,
  otp: string
): Promise<{ valid: boolean; message: string }> {
  // Try cache first
  let stored = cacheGet<string>(`otp_mobile_${nationalId}`);

  if (!stored) {
    // Fallback to DB (within last 2 minutes)
    const threshold = new Date(Date.now() - 2 * 60 * 1000);
    const log = await otpLogRepo.findOne({
      where: {
        nationalId,
        otpType: "Mobile",
        dateAdded: MoreThanOrEqual(threshold),
      },
      order: { dateAdded: "DESC" },
    });
    if (!log) return { valid: false, message: "OTP expired or doesn't exist" };
    stored = log.mobileOtp;
  }

  if (String(stored) !== String(otp)) {
    return { valid: false, message: "Invalid OTP. Please try again." };
  }

  return { valid: true, message: "" };
}

// ── Confirm mobile OTP (clear cache + log) ────────────────────
export async function confirmMobileOtp(
  nationalId: string,
  otp: string
): Promise<{ valid: boolean; message: string }> {
  const result = await validateMobileOtp(nationalId, otp);
  if (!result.valid) return result;

  cacheDel(`otp_mobile_${nationalId}`);
  const log = await otpLogRepo.findOne({
    where: { nationalId, otpType: "Mobile", mobileOtp: otp },
    order: { dateAdded: "DESC" },
  });
  if (log) await otpLogRepo.remove(log);

  return { valid: true, message: "" };
}

// ── Send email OTP ────────────────────────────────────────────
export async function sendEmailOtp(
  nationalId: string,
  email: string
): Promise<{ success: boolean; message?: string }> {
  const otp = generateOtp();
  cacheSet(`otp_email_${nationalId}`, otp, 60);

  const name = await yakeenRepo.findOne({ where: { userId: nationalId } });
  const nameEn = name?.nameEn || "";
  const nameAr = name?.nameAr || "";

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
      <h2>تحقق من بريدك الإلكتروني / Verify your Email</h2>
      <p>عزيزي ${nameAr || nameEn},</p>
      <p>رمز التحقق الخاص بك هو:</p>
      <h1 style="color:#1a3c6e; letter-spacing: 8px;">${otp}</h1>
      <p style="direction:ltr; text-align:left;">Dear ${nameEn || nameAr},<br>Your verification code is: <strong>${otp}</strong></p>
      <p style="color:#888; font-size:12px;">This code expires in 60 seconds.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      email,
      subject: "Verify your Email - Tayseer Arabian Company",
      html:    htmlBody,
    });

    await otpLogRepo.save(
      otpLogRepo.create({ nationalId, mobileOtp: otp, otpType: "Mail" })
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, message: String(err.message) };
  }
}

// ── Validate + confirm email OTP ──────────────────────────────
export async function confirmEmailOtp(
  nationalId: string,
  otp: string
): Promise<{ valid: boolean; message: string }> {
  let stored = cacheGet<string>(`otp_email_${nationalId}`);

  if (!stored) {
    const threshold = new Date(Date.now() - 2 * 60 * 1000);
    const log = await otpLogRepo.findOne({
      where: {
        nationalId,
        otpType: "Mail",
        dateAdded: MoreThanOrEqual(threshold),
      },
      order: { dateAdded: "DESC" },
    });
    if (!log) return { valid: false, message: "OTP expired or doesn't exist" };
    stored = log.mobileOtp;
  }

  if (String(stored) !== String(otp)) {
    return { valid: false, message: "Invalid OTP. Please try again." };
  }

  cacheDel(`otp_email_${nationalId}`);
  const log = await otpLogRepo.findOne({
    where: { nationalId, otpType: "Mail", mobileOtp: otp },
    order: { dateAdded: "DESC" },
  });
  if (log) await otpLogRepo.remove(log);

  return { valid: true, message: "" };
}
