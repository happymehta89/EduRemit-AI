/**
 * Seed / Demo script
 * --------------------------------------------------------------------------
 * Creates 5 parents, 5 students, and 1 university, links them, generates and
 * funds real Stellar testnet wallets for each, sends real funding payments
 * from parents to students, has students log expenses and pay the university,
 * and generates an AI budget report for each student.
 *
 * This is meant to give you a realistic, fully-on-chain demo dataset to:
 *  - screenshot for "proof of wallet interactions"
 *  - walk through in your demo video
 *  - show real Stellar testnet transaction hashes in the submission
 *
 * Run with: npm run seed
 * (Takes a few minutes — each wallet funding and payment is a real testnet call.)
 * --------------------------------------------------------------------------
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Expense from "../models/Expense.js";
import AIReport from "../models/AIReport.js";
import { createFundedWallet, sendPayment } from "../services/stellarService.js";
import { analyzeSpending } from "../services/aiAdvisorService.js";

const PARENT_NAMES = ["Rajesh Kumar", "Anjali Sharma", "Ramesh Patel", "Vikram Singh", "Priya Nair"];
const STUDENT_NAMES = ["Aarav Kumar", "Diya Sharma", "Rahul Patel", "Rohan Singh", "Ananya Nair"];
const CATEGORIES = ["food", "books", "rent", "transport", "fees"];

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function makeUser({ name, email, role, universityName }) {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  console.log(`  creating + funding wallet for ${name} (${role})...`);
  const wallet = await createFundedWallet();
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    walletPublicKey: wallet.publicKey,
    walletSecretKeyEncrypted: wallet.secretKey,
    universityName,
  });
  return user;
}

async function run() {
  console.log("Connecting to database...");
  await connectDB();

  console.log("\nClearing previous seed data (only documents created by this script's emails)...");
  const demoEmails = [
    ...PARENT_NAMES.map((_, i) => `parent${i + 1}@eduremit.demo`),
    ...STUDENT_NAMES.map((_, i) => `student${i + 1}@eduremit.demo`),
    "university@eduremit.demo",
  ];
  await User.deleteMany({ email: { $in: demoEmails } });

  console.log("\nCreating university...");
  const university = await makeUser({
    name: "Global Tech University",
    email: "university@eduremit.demo",
    role: "university",
    universityName: "Global Tech University",
  });

  console.log("\nCreating parents...");
  const parents = [];
  for (let i = 0; i < PARENT_NAMES.length; i++) {
    const p = await makeUser({
      name: PARENT_NAMES[i],
      email: `parent${i + 1}@eduremit.demo`,
      role: "parent",
    });
    parents.push(p);
  }

  console.log("\nCreating students and linking to parents...");
  const students = [];
  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const s = await makeUser({
      name: STUDENT_NAMES[i],
      email: `student${i + 1}@eduremit.demo`,
      role: "student",
    });
    s.linkedParent = parents[i]._id;
    await s.save();
    parents[i].linkedStudents.push(s._id);
    await parents[i].save();
    students.push(s);
  }

  console.log("\nSending real testnet funding payments (parent -> student)...");
  for (let i = 0; i < parents.length; i++) {
    const amount = randomAmount(300, 800);
    try {
      const result = await sendPayment({
        senderSecretKey: parents[i].walletSecretKeyEncrypted,
        receiverPublicKey: students[i].walletPublicKey,
        amount,
        memo: "Education funding",
      });
      await Transaction.create({
        sender: parents[i]._id,
        receiver: students[i]._id,
        senderWallet: parents[i].walletPublicKey,
        receiverWallet: students[i].walletPublicKey,
        amount,
        hash: result.hash,
        type: "funding",
        memo: "Education funding",
        status: "success",
      });
      console.log(`  ${parents[i].name} -> ${students[i].name}: ${amount} XLM (tx ${result.hash.slice(0, 12)}...)`);
    } catch (err) {
      console.error(`  FAILED funding ${students[i].name}:`, err.message);
    }
  }

  console.log("\nLogging student expenses...");
  for (const student of students) {
    const numExpenses = 4 + Math.floor(Math.random() * 4);
    for (let j = 0; j < numExpenses; j++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      await Expense.create({
        studentId: student._id,
        category,
        amount: randomAmount(10, 120),
        note: `${category} expense`,
      });
    }
    console.log(`  ${student.name}: ${numExpenses} expenses logged`);
  }

  console.log("\nStudents paying university tuition (real testnet payments)...");
  for (const student of students) {
    const amount = randomAmount(100, 250);
    try {
      const result = await sendPayment({
        senderSecretKey: student.walletSecretKeyEncrypted,
        receiverPublicKey: university.walletPublicKey,
        amount,
        memo: "Tuition payment",
      });
      await Transaction.create({
        sender: student._id,
        receiver: university._id,
        senderWallet: student.walletPublicKey,
        receiverWallet: university.walletPublicKey,
        amount,
        hash: result.hash,
        type: "tuition",
        memo: "Tuition payment",
        status: "success",
      });
      console.log(`  ${student.name} -> university: ${amount} XLM (tx ${result.hash.slice(0, 12)}...)`);
    } catch (err) {
      console.error(`  FAILED tuition payment for ${student.name}:`, err.message);
    }
  }

  console.log("\nGenerating AI budget reports...");
  for (const student of students) {
    const expenses = await Expense.find({ studentId: student._id });
    const analysis = await analyzeSpending(expenses);
    await AIReport.create({
      studentId: student._id,
      summary: analysis.summary,
      insights: analysis.insights,
      riskLevel: analysis.riskLevel,
      categoryBreakdown: analysis.categoryBreakdown,
      generatedBy: analysis.generatedBy,
    });
    console.log(`  ${student.name}: report generated (risk: ${analysis.riskLevel})`);
  }

  console.log("\nClearing parent wallets to force Freighter connection...");
  for (const parent of parents) {
    parent.walletPublicKey = null;
    parent.walletSecretKeyEncrypted = null;
    await parent.save();
  }

  console.log("\n✅ Seed complete.");
  console.log("\nDemo login credentials (all use password: Password123!):");
  parents.forEach((p, i) => console.log(`  Parent:     ${p.email}`));
  students.forEach((s, i) => console.log(`  Student:    ${s.email}`));
  console.log(`  University: ${university.email}`);

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
