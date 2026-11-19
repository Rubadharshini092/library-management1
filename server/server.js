
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Allow local development and deployed Vercel frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://library-management1-eight.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/librarymanagement";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "General" },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);

app.get("/", (_req, res) => {
  res.json({ message: "Library Management API is running" });
});

app.get("/api/books", async (_req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch books",
      error: error.message
    });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const {
      title,
      author,
      isbn = "",
      category = "General",
      available = true
    } = req.body;

    if (!title?.trim() || !author?.trim()) {
      return res.status(400).json({
        message: "Title and author are required."
      });
    }

    const book = await Book.create({
      title, author, isbn, category, available
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({
      message: "Could not add book",
      error: error.message
    });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    res.json(book);
  } catch (error) {
    res.status(400).json({
      message: "Could not update book",
      error: error.message
    });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    res.json({ message: "Book deleted successfully." });
  } catch (error) {
    res.status(400).json({
      message: "Could not delete book",
      error: error.message
    });
  }
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
