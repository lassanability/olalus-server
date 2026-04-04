const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  educationType: String,
  nameOfSchool: String,
  location: String,
  yearsCompleted: String,
  majorDegree: String,
}, { _id: false });

const workExperienceSchema = new mongoose.Schema({
  employerName: String,
  address: String,
  cityStateZip: String,
  phone: String,
  lastSupervisor: String,
  employmentFrom: String,
  employmentTo: String,
  startPay: String,
  finalPay: String,
  lastJobTitle: String,
  reasonForLeaving: String,
  jobDuties: String,
}, { _id: false });

const referenceSchema = new mongoose.Schema({
  name: String,
  occupation: String,
  companyName: String,
  address: String,
  telephone: String,
  email: String,
  yearAcquainted: String,
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  // Required top-level fields
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  position: { type: String, required: true, trim: true },

  // Personal information
  personalInfo: {
    middleName: String,
    maidenName: String,
    presentAddress: String,
    howLongInPA: String,
    telephone: String,
    ifUnder18Age: String,
    email: String,
  },

  // Employment desired
  employmentDesired: {
    positionApplied: String,
    daysHoursAvailable: String,
    salaryDesired: String,
    hoursPerWeek: String,
    canWorkEvenings: String,
    employmentType: String,
    availableStartDate: String,
  },

  // Education (High School, College, Professional/Graduate)
  education: [educationSchema],

  // Work experience (up to 3 employers)
  workExperience: [workExperienceSchema],

  // Additional questions
  additionalQuestions: {
    currentlyEmployed: String,
    contactCurrentEmployer: String,
    completedSelf: String,
    ifNotWho: String,
    convictedFelony: String,
    felonyExplanation: String,
    armedForces: String,
    armedForcesSpecialty: String,
    armedForcesDateEntered: String,
    armedForcesDischargeDate: String,
    nationalGuard: String,
    proofOfCitizenship: String,
    previouslyEmployedHere: String,
    previouslyEmployedWhen: String,
    relativesEmployed: String,
    relativesNames: String,
    reliableTransportation: String,
    canPerformEssentialFunctions: String,
    cannotPerformDescription: String,
  },

  // References (3)
  references: [referenceSchema],

  // Waiver initials and signature
  waiver: {
    initials1: String,
    initials2: String,
    initials3: String,
    signature: String,
    signatureDate: String,
  },

  // Legacy simple-apply fields
  message: String,
  resumeUrl: String,
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
