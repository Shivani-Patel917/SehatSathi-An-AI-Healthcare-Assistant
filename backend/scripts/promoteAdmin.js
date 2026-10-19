
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

async function promoteAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error("Add ADMIN_EMAIL to backend/.env first.");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from backend/.env.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(
      `No account found for ${email}. Register that account first.`
    );
  }

  user.role = "admin";
  await user.save();

  console.log(`Admin access granted to ${email}.`);
}

promoteAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
