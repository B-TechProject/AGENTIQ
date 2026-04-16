// controllers/testRun.controller.js
import TestRun from "../models/testRun.model.js";

export const getAllRuns = async (req, res) => {
  const runs = await TestRun.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.json(runs);
};

export const getRunById = async (req, res) => {
    const run = await TestRun.findById(req.params.id);
  
    res.json(run);
  };