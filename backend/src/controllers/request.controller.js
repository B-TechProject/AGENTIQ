// controllers/request.controller.js
import axios from "axios";

export const sendRequest = async (req, res) => {
    const { method, url, headers = {}, body = {}, params = {} } = req.body;

    

  const start = Date.now();

  try {
    const response = await axios({
        method,
        url,
        headers,
        data: body,
        params
      });

    const end = Date.now();

    return res.json({
      status: response.status,
      headers: response.headers,
      data: response.data,
      time: end - start
    });

  } catch (error) {
    const end = Date.now();

    return res.status(500).json({
      status: error.response?.status || 500,
      data: error.response?.data || error.message,
      headers: error.response?.headers || {},
      time: end - start
    });
  }
};