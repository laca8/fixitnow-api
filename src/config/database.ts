import { DataSource } from "typeorm";
import dotenv from "dotenv";
dotenv.config();

import { TermsAndConditions } from "../entities/TermsAndConditions";
import { Applicant } from "../entities/Applicant";
import { PersonalInformation } from "../entities/PersonalInformation";
import { JobInformation } from "../entities/JobInformation";
import { IncomeInformation } from "../entities/IncomeInformation";
import { CalculatorInformation } from "../entities/CalculatorInformation";
import { KnowusInformation } from "../entities/KnowusInformation";
import { FinalStepInformation } from "../entities/FinalStepInformation";
import { IBANVerification } from "../entities/IBANVerification";
import { NafazRequest } from "../entities/NafazRequest";
import { NafazLog } from "../entities/NafazLog";
import { YakeenUserData } from "../entities/YakeenUserData";
import { YakeenLog } from "../entities/YakeenLog";
import { TahaqqRecord } from "../entities/TahaqqRecord";
import { TahaqqLog } from "../entities/TahaqqLog";
import { GOSIRecord } from "../entities/GOSIRecord";
import { GOSILog } from "../entities/GOSILog";
import { OtpLog } from "../entities/OtpLog";
import { MaintenanceCenter } from "../entities/MaintenanceCenter";
import { ErrorLog } from "../entities/ErrorLog";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "loans",
  synchronize: process.env.NODE_ENV === "development",  // auto-migrate in dev only
  logging: process.env.NODE_ENV === "development",
  entities: [
    TermsAndConditions,
    Applicant,
    PersonalInformation,
    JobInformation,
    IncomeInformation,
    CalculatorInformation,
    KnowusInformation,
    FinalStepInformation,
    IBANVerification,
    NafazRequest,
    NafazLog,
    YakeenUserData,
    YakeenLog,
    TahaqqRecord,
    TahaqqLog,
    GOSIRecord,
    GOSILog,
    OtpLog,
    MaintenanceCenter,
    ErrorLog,
  ],
  migrations: ["dist/migrations/*.js"],
  charset: "utf8mb4",
});
