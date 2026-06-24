import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["parent", "student", "university"],
      required: true,
    },

    // Stellar wallet
    walletPublicKey: { type: String, default: null },
    walletSecretKeyEncrypted: { type: String, default: null }, // demo-only, see services/wallet.js note

    // Relationships
    linkedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // for parents
    linkedParent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // for students

    // University-specific
    universityName: { type: String, default: null },

    onboardingFeedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: null },
      submittedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.walletSecretKeyEncrypted;
  return obj;
};

export default mongoose.model("User", userSchema);
