import axios from "axios";

const LEAN_AUTH_URL = "https://auth.sa.leantech.me/oauth2/token";
const LEAN_VERIFY_URL = "https://api2.sa.leantech.me/verifications/v2/iban";

const LEAN_CLIENT_ID = process.env.LEAN_CLIENT_ID || "";
const LEAN_CLIENT_SECRET = process.env.LEAN_CLIENT_SECRET || "";
const LEAN_APP_TOKEN = process.env.LEAN_APP_TOKEN || "";

// ── Get LeanTech access token ─────────────────────────────────
async function getLeanToken(): Promise<string> {
  const params = new URLSearchParams({
    client_id: LEAN_CLIENT_ID,
    client_secret: LEAN_CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "api",
  });

  const res = await axios.post(LEAN_AUTH_URL, params.toString(), {
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

  return res.data.access_token;
}

// ── Verify IBAN ownership ─────────────────────────────────────
async function verifyIban(
  token: string,
  iban: string,
  nationalId: string
): Promise<any> {
  const res = await axios.post(
    LEAN_VERIFY_URL,
    {
      type: "PERSONAL",
      iban,
      identifications: [{ type: "NATIONAL_ID", value: nationalId }],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "lean-app-token": LEAN_APP_TOKEN,
        "content-type": "application/json",
      },
    }
  );
  return res.data;
}

// ── Full IBAN verification flow ───────────────────────────────
export async function processIbanVerification(
  iban: string,
  nationalId: string,
  language: "ar" | "en" = "en"
): Promise<{
  success: boolean;
  message: string;
  data?: {
    iban: string;
    nationalId: string;
    bankName: any;
    bankCode: string;
    swiftCode: string;
    accountStatus: string;
    ibanVerified: boolean;
    raw: any;
  };
}> {
  const lang = language === "ar" ? "ar" : "en";

  try {
    const token = await getLeanToken();
    const response = await verifyIban(token, iban, nationalId);

    if (!response || response.status !== "OK") {
      return {
        success: false,
        message:
          lang === "ar"
            ? "رقم الآيبان غير صحيح أو غير صالح"
            : "The IBAN is invalid or incorrect"
      };
    }

    const v = response.verifications ?? {};

    if (v.iban_ownership_verified !== true) {
      return {
        success: false,
        message: lang === "ar" ? "رقم الآيبان لا يخص المستخدم" : "IBAN not owned by user",
      };
    }

    if (v.account_status !== "ACTIVE") {
      return {
        success: false,
        message: lang === "ar" ? "الحساب البنكي غير نشط" : "Account not active",
      };
    }

    return {
      success: true,
      message: lang === "ar" ? "تم التحقق من الآيبان بنجاح" : "IBAN verified successfully",
      data: {
        iban,
        nationalId,
        bankName: v.bank_name,
        bankCode: v.bank_code,
        swiftCode: v.swift_code,
        accountStatus: v.account_status,
        ibanVerified: v.iban_ownership_verified,
        raw: v,
      },
    };
  } catch {
    return {
      success: false,
      message: lang === "ar" ? "حدث خطأ ما" : "Something went wrong",
    };
  }
}
