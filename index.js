const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const commentRoute = require("./routes/comments");
const statsRoute = require("./routes/stats");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// Load environment variables
dotenv.config();

// Middleware
const app = express();
app.use(express.json());

// CORS Configuration
const allowedOrigins = [
  "https://achievehub-blog.onrender.com",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const allowedFormats = ["png", "jpg", "jpeg", "webp"];
    const fileFormat = file.mimetype.split("/")[1];

    if (!allowedFormats.includes(fileFormat)) {
      return Promise.reject(
        new Error("Invalid file format. Only PNG, JPG, and JPEG are allowed.")
      );
    }

    return {
      folder: "blog_images",
      format: fileFormat,
      public_id: file.originalname.split(".")[0],
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // Limit file size to 3MB
});

// Upload Route
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({
      message:
        "Invalid file upload. Ensure it is PNG, JPG, or JPEG and below 3MB.",
    });
  }
  res.status(200).json({ message: "File has been uploaded", url: req.file.path });
});

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);
app.use("/api/stats", statsRoute);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "build")));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 7733;
app.listen(PORT, () => {
  console.log("Backend is running.");
});