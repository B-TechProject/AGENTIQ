// models/testCase.model.js
import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  method: String,
  url: String,
  headers: Object,
  body: Object,
  assertions: Object
}, { timestamps: true });

export default mongoose.model("TestCase", testCaseSchema);