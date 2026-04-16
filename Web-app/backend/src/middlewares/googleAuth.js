import mongoose from "mongoose";
import GUsers from "../models/googleUsers.js";
import { generateToken } from "../utils/token.js";

export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, picture } = req.user._json;
    if (!email || !name) return res.status(400).json({ message: "Insufficient google data" });

    const findUser = await GUsers.findOne({ email });

    let user = findUser;
    if (!findUser) {
      const newUser = new GUsers({ email, fullName: name, profilePicture: picture });
      await newUser.save();
      user = newUser;
    }

    const token = generateToken(user.email);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    // for debugging you can also return token in body:
    // return res.json({ token, user });

    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};