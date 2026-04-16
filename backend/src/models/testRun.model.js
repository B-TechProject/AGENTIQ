import mongoose from "mongoose";

const testRunSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  summary: {
    totalTests: Number,
    passed: Number,
    failed: Number,
    vulnerabilities: Number
  },

  functional: [
    {
      name: String,
      status: String,
      responseTime: Number,
      assertions: Array,
      error: String, 
      explanation: String // ✅ Added this to store AI insights
    }
  ],

  security: [
    {
      type: {
        type: String
      },
      vulnerable: Boolean,
      reason: String
    }
  ]

}, { timestamps: true });

export default mongoose.model("TestRun", testRunSchema);