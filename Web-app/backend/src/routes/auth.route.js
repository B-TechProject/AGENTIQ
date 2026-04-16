import express from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/auth.controller.js";
import protectRoute from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser) ;

router.post("/login" , loginUser)

router.post("/logout" , logoutUser);

router.get("/me" , protectRoute, (req,res) => {
    console.log(req.user);
    return res.status(200).json({
        user : req.user
    })
})

export default router ;