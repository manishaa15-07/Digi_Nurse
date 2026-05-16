// import jwt from "jsonwebtoken";
// import Patient from "../models/Patient.js";

// const protectPatient = async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     try {
//       token = req.headers.authorization.split(" ")[1];

//       if (!process.env.JWT_SECRET) {
//         throw new Error("JWT_SECRET is not defined");
//       }

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Attach patient to request
//       req.patient = await Patient.findById(decoded.id).select("-password");

//       if (!req.patient) {
//         return res.status(401).json({ message: "Patient not found" });
//       }

//       next();
//     } catch (error) {
//       console.error("Auth Middleware Error:", error);
//       res.status(401).json({ message: "Not authorized, token failed" });
//     }
//   } else {
//     res.status(401).json({ message: "No token, authorization denied" });
//   }
// };

// export default protectPatient;




import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";

const protectPatient = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach patient to request
      const patient = await Patient.findById(decoded.id).select("-password");

      if (!patient) {
        return res.status(401).json({ message: "Patient not found" });
      }

      // Set both req.patient and req.patient.id for compatibility
      req.patient = patient;
      req.patient.id = patient._id;

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "No token, authorization denied" });
  }
};

export default protectPatient;