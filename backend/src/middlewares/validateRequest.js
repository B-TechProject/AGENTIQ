// middleware/validateRequest.js
export const validateRequest = (req, res, next) => {
  const { method, url } = req.body;

  if (!method || !url) {
    return res.status(400).json({
      success: false,
      error: "method and url are required"
    });
  }

  next();
};