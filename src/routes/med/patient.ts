import { Router } from "express"
import { HttpError } from "../../../errors";
import Doctor from "../../model/doctor";
import Meal from "../../model/meal";
import Patient from "../../model/patient";
import Report from "../../model/report";
import { v4 as uuidv4 } from 'uuid'

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
  '/meals',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const meals = await Meal.query().where("patientId", patientId).orderBy("date", "desc")
      
      // TODO

      res.json({
        //doctors: jsonDoctors,
      })
    } catch (err) {
      next(err)
    }
  }
)

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
      
      // TODO: here we should trigger the report download
      res.json({
        info: report.getInfo()
      })
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
      /*
      const finalDestination = TODO

      const file = req.files.file

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
  */
    } catch (err) {
      next(err)
    }
  }
);

export default router