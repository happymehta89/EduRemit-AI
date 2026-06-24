import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { createFundedWallet } from "../services/stellarService.js";

export async function signup(req, res, next) {
  try {
    const { name, email, password, role, universityName, parentEmail } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are all required." });
    }
    if (!["parent", "student", "university"].includes(role)) {
      return res.status(400).json({ error: "Role must be parent, student, or university." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      walletPublicKey: null, // User connects wallet later
      universityName: role === "university" ? universityName : undefined,
    });

    // Link student to parent at signup time, if a parent email was given
    if (role === "student" && parentEmail) {
      const parent = await User.findOne({ email: parentEmail.toLowerCase(), role: "parent" });
      if (parent) {
        user.linkedParent = parent._id;
        parent.linkedStudents.push(user._id);
        await parent.save();
      }
    }

    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

export async function linkStudent(req, res, next) {
  // Parent links an existing student account by email
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts can link students." });
    }
    const { studentEmail } = req.body;
    const student = await User.findOne({ email: studentEmail?.toLowerCase(), role: "student" });
    if (!student) {
      return res.status(404).json({ error: "No student account found with that email." });
    }

    if (!req.user.linkedStudents.includes(student._id)) {
      req.user.linkedStudents.push(student._id);
      await req.user.save();
    }
    student.linkedParent = req.user._id;
    await student.save();

    res.json({ message: `Linked to ${student.name}.`, student: student.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function submitFeedback(req, res, next) {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }
    req.user.onboardingFeedback = { rating, comment: comment || "", submittedAt: new Date() };
    await req.user.save();
    res.json({ message: "Thanks for the feedback!", feedback: req.user.onboardingFeedback });
  } catch (err) {
    next(err);
  }
}
