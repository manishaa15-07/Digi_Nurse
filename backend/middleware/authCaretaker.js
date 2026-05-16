import jwt from "jsonwebtoken";
import Caretaker from "../models/Caretaker.js";

const protectCaretaker = async (req, res, next) => {
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

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach caretaker to request
      const caretaker = await Caretaker.findById(decoded.id).select("-password");

      if (!caretaker) {
        return res.status(401).json({ message: "Caretaker not found" });
      }

      // Set both req.caretaker and req.caretaker.id for compatibility
      req.caretaker = caretaker;
      req.caretaker.id = caretaker._id;

      next();
    } catch (error) {
      console.error("Caretaker Auth Middleware Error:", error);
      res.status(401).json({ message: "Not authorized, token invalid" });
    }
  } else {
    res.status(401).json({ message: "No token, authorization denied" });
  }
};

export default protectCaretaker;
