import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const caretakerSchema = new mongoose.Schema(
  {
    caretakerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    fullName: { type: String, required: true },
    professionalRole: String,
    organization: String,
    orgId: String,
    contact: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    agreeToTerms: { type: Boolean, default: false },
    agreeToEthics: { type: Boolean, default: false },

    linkedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }],
    pendingPatientRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }],

    specializations: [
      {
        type: String,
        enum: [
          "Physiotherapy",
          "Elder Care",
          "Post-Surgery Recovery",
          "Rehabilitation",
          "Nutrition",
          "Palliative Care",
          "Other",
        ],
      },
    ],
    experienceYears: { type: Number },
  },
  { timestamps: true }
);

caretakerSchema.pre("save", async function (next) {
  if (!this.caretakerId) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.caretakerId = `CT${randomNum}`;
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

const Caretaker = mongoose.model("Caretaker", caretakerSchema);
export default Caretaker;
