import jwt from "jsonwebtoken";

export const generateToken = (email) => {
  const jwtToken = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  return jwtToken;
};
