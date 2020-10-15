import { Router } from "express"
import { HttpError } from "../../../errors";
import Doctor from "../../model/doctor";
import Meal from "../../model/meal";
import Patient from "../../model/patient";
import Report from "../../model/report";
import { v4 as uuidv4 } from 'uuid'
import Balance from "../../model/balance";
import { join } from "path"
import config from "config"
import { decryptData, encryptData, generateKeyIV } from "../../util";
import util from "util"
import fs, { read } from "fs"

const writeFile = util.promisify(fs.writeFile)
const readFile = util.promisify(fs.readFile)

const router = Router({
  mergeParams: true,
})

// Middleware to check that the current doctor can access the patient
router.use(async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      throw new HttpError("bad patient id format", 400)
    }

    const doctor = res.locals.doctor as Doctor
    if (!await doctor.canReadPatient(patientId)) {
      throw new HttpError("missing patient authorization", 403)
    }

    res.locals.patientId = patientId

    next()
  } catch (err) {
    next(err)
  }
})

router.get(
  '/info',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const patient: Patient = await Patient.query().findById(patientId)
      const jsonPatient = patient.getInfo()

      res.json({
        info: jsonPatient,
      })
    } catch (err) {
      next(err)
    }
  }
);

router.get(
  '/doctors',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const authorizedDoctors = await Patient.relatedQuery<Doctor>("doctors").for(patientId)
      const jsonDoctors = authorizedDoctors.map(doctor => doctor.getShortInfo())

      // TODO: only the admin should see the authorized doctors?
      // TODO: test unauthorized

      res.json({
        doctors: jsonDoctors,
      })
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/meals',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const meals = await Meal.query().where("patientId", patientId).orderBy("date", "desc")
      const jsonMeals = meals.map(meal => meal.getInfo())

      res.json({
        meals: jsonMeals,
      })
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/balances',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const balances = await Balance.query().where("patientId", patientId).orderBy("date", "desc")
      const jsonBalances = balances.map(balance => balance.getInfo())

      res.json({
        balances: jsonBalances,
      })
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/reports',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const reports = await Patient.relatedQuery<Report>("reports").for(patientId).orderBy("date", "desc")
      const jsonReports = reports.map(report => report.getInfo())

      res.json({
        reports: jsonReports,
      })
    } catch (err) {
      next(err)
    }
  }
);

router.get(
  '/report/:reportId/download',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const reportId = parseInt(req.params.reportId);
      if (isNaN(reportId)) {
        throw new HttpError("bad report id format", 400)
      }

      const report: Report | undefined = await Report.query().findById(reportId)
      if (!report) {
        throw new HttpError("report not found", 404)
      }

      // Make sure the report id belongs to the user
      if (report.patientId !== patientId) {
        throw new HttpError("patient mismatch", 403)
      }

      // Load the report file contents
      const reportPath = join(config.get("uploadDestinationDir"), report.location)
      const encryptedReportContent = await readFile(reportPath)
      
      // Decrypt the file contents
      const [iv, key] = report.getIVKey()
      const decryptedData = decryptData(iv, key, encryptedReportContent)

      const downloadFilename = `${patientId}_${report.date.getTime()}.pdf`

      res.setHeader('Content-disposition', `attachment; filename=${downloadFilename}`);
      res.setHeader('Content-type', "application/pdf");
      res.end(decryptedData)
    } catch (err) {
      next(err)
    }
  }
);

router.post(
  '/report/upload',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;

      if (!req.files || Object.keys(req.files).length === 0) {
        throw new HttpError("missing file", 400)
      }

      const uuid = uuidv4()
      const finalFilename = `${patientId}-${uuid}.pdf`
      const finalDestination = join(config.get("uploadDestinationDir"), finalFilename)

      const uploadedFile = req.files.file
      if (!uploadedFile) {
        throw new HttpError("missing file", 400)
      }

      // Generate a pair of random IV and key to encrypt the file
      const [iv, key] = generateKeyIV()
      
      // Encrypt the file
      const encryptedFileData = encryptData(iv, key, uploadedFile.data)

      // Save the encrypted file to the final destination
      await writeFile(finalDestination, encryptedFileData)

      // Then finally add the report inside the db, saving the key and IV vector
      const report = await Report.query().insert({
        date: new Date(),
        patientId: patientId,
        iv: iv.toString("base64"),
        key: key.toString("base64"),
        location: finalFilename,
      })

      res.json({
        report: report.getInfo()
      })
    } catch (err) {
      next(err)
    }
  }
);

export default router