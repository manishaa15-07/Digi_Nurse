import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";

const protectDoctor = async (req, res, next) => {
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

      // Attach doctor to request
      const doctor = await Doctor.findById(decoded.id).select("-password");

      if (!doctor) {
        return res.status(401).json({ message: "Doctor not found" });
      }

      // Set both req.user and req.user.id for compatibility
      req.user = doctor;
      req.user.id = doctor._id;

      next();
    } catch (error) {
      console.error("Doctor Auth Middleware Error:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "No token, authorization denied" });
  }
};

export default protectDoctor;
