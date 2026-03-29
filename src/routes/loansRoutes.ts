import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  IDVerificationDto, StatusCheckDto, TahaqqDto,
  SendMobileOtpDto, ConfirmMobileOtpDto, SendEmailOtpDto,
  ConfirmEmailOtpDto, PersonalInformationDto, JobInformationDto,
  GOSIDto, IncomeInformationDto, CalculatorDto, KnowUsDto,
  FinalStepDto, IBANVerificationDto, SelectedTermsDto,
} from "../dto";

import * as ctrl from "../controllers/loansController";

// ── Multer setup ──────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || "uploads/fixitnow";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

const router = Router();

// ─────────────────────────────────────────────────────────────
// STEP 1 — Terms & Conditions
// ─────────────────────────────────────────────────────────────
router.get("/terms_and_conditions", ctrl.getTerms);
router.post("/terms_and_conditions", validateBody(SelectedTermsDto), ctrl.postTerms);
router.get("/terms_and_conditions_mobile", ctrl.getTerms);
router.post("/terms_and_conditions_mobile", validateBody(SelectedTermsDto), ctrl.postTerms);

// ─────────────────────────────────────────────────────────────
// STEP 2 — Identity Verification
// ─────────────────────────────────────────────────────────────
router.post("/IDVerification", validateBody(IDVerificationDto), ctrl.idVerification);
router.post("/SendIDVerification", validateBody(IDVerificationDto), ctrl.sendIdVerification);
router.post("/NafathCallback", ctrl.nafathCallback);
router.get("/StatusCheck", validateQuery(StatusCheckDto), ctrl.statusCheck);
router.post("/Add_Yakeen_data", validateBody(IDVerificationDto), ctrl.getYakeenData);

// ─────────────────────────────────────────────────────────────
// STEP 3 — Contact Verification + Personal Info
// ─────────────────────────────────────────────────────────────
router.post("/Mobile_Tahaqqaq", validateBody(TahaqqDto), ctrl.mobileTahaqq);
router.post("/Send_Mobile_SMS", validateBody(SendMobileOtpDto), ctrl.sendMobileSms);
router.post("/Confirm_Mobile_OTP", validateBody(ConfirmMobileOtpDto), ctrl.confirmMobileOtp);
router.post("/Send_Email_OTP", validateBody(SendEmailOtpDto), ctrl.sendEmailOtp);
router.post("/Confirm_Email_OTP", validateBody(ConfirmEmailOtpDto), ctrl.confirmEmailOtp);
router.get("/PersonalInformation", ctrl.getPersonalInfo);
router.post("/PersonalInformation", validateBody(PersonalInformationDto), ctrl.postPersonalInfo);

// ─────────────────────────────────────────────────────────────
// STEP 4 — Job Information
// (Oracle-backed dropdown endpoints are kept as-is via Oracle)
// ─────────────────────────────────────────────────────────────
router.post("/JobInformation", validateBody(JobInformationDto), ctrl.postJobInfo);

// ─────────────────────────────────────────────────────────────
// STEP 5 — GOSI + Income
// ─────────────────────────────────────────────────────────────
router.post("/GOSIInformation", validateBody(GOSIDto), ctrl.getGosiInfo);
router.post("/IncomeInformation", validateBody(IncomeInformationDto), ctrl.postIncomeInfo);

// ─────────────────────────────────────────────────────────────
// STEP 6 — Calculator
// ─────────────────────────────────────────────────────────────
router.post("/CalculatorInformation", validateBody(CalculatorDto), ctrl.postCalculatorInfo);

// ─────────────────────────────────────────────────────────────
// STEP 7 — Know Us
// ─────────────────────────────────────────────────────────────
router.post("/KnowUsInformation", validateBody(KnowUsDto), ctrl.postKnowUsInfo);

// ─────────────────────────────────────────────────────────────
// STEP 8a — FixItNow Final Step
// ─────────────────────────────────────────────────────────────
router.post(
  "/FinalStepInformation",
  upload.single("file"),
  validateBody(FinalStepDto),
  ctrl.postFinalStep
);

// ─────────────────────────────────────────────────────────────
// STEP 8b — DebtPurchase IBAN Verification
// ─────────────────────────────────────────────────────────────
router.post("/IBANVerificationView", validateBody(IBANVerificationDto), ctrl.postIbanVerification);

export default router;
