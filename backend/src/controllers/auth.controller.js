import GUsers from "../models/googleUsers.js";
import Users from "../models/mongoUsers.js";
import { generateToken } from "../utils/token.js";

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

  if (!fullName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const existingUserG = await GUsers.findOne({email}) ;

  if(existingUserG){
    return res.status(400).json({message : "User with this email already exists"})
  }

  const existingUser = await Users.findOne({email}) ;

  if(existingUser){
    return res.status(400).json({message : "User with this email already exists"})
  }

  const newUser = new Users({
    email,
    fullName,
    password
  })

  await newUser.save() ;

  const token = generateToken(newUser.email);

  res.cookie("token",token,{
    httpOnly : true,
    secure : true,
    sameSite : "none"
  })

  return res.status(201).json({
    message : "User registered successfully ",
    user : newUser
  })
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }

};

export const loginUser = async (req,res) => {
    try {
        const  {email , password} = req.body ;

    if(!email || !password){
        return res.status(400).json({message : "All fields are required"})
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user.email);
    console.log("Token from cookies:", token);

  res.cookie("token",token,{
    httpOnly : true,
    secure : true,
    sameSite : "none"
  })

  return res.status(201).json({
    message : "User login successfull ",
    user : user
  })
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const logoutUser = (req,res) => {
    res.clearCookie("token");
    res.status(200).json({success: "true", message: "Logged out successfully"});
}