// models/project.model.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  name: String,
  baseUrl: String
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);