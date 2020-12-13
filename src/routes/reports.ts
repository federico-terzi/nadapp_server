import Report from "../model/report"
import express from "express"
import { HttpError } from "../../errors"
import { join } from "path"
import config from "config"
import util from "util"
import fs from "fs"
import { decryptData } from "../util"
import crypto from "crypto"

const readFile = util.promisify(fs.readFile)

export const downloadReportResponse = async (reportId: number, patientId: number, res: express.Response) => {
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

  // Generate the HMAC signature
  const hmac = crypto.createHmac("sha256", key).update(decryptedData).digest("base64")

  // Verify that the signature is matching
  if (hmac !== report.hmac) {
    throw new HttpError("integrity error", 500)
  }

  const downloadFilename = `${patientId}_${report.date.getTime()}.pdf`

  res.setHeader('Content-disposition', `attachment; filename=${downloadFilename}`);
  res.setHeader('Content-type', "application/pdf");
  res.end(decryptedData)
}