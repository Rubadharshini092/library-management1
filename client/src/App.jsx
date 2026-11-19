
import { useEffect, useMemo, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const API = `${API_BASE}/books`;

const emptyForm = {
  title: "",
  author: "",
  isbn: "",
  category: "General",
};

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load all books
  async function loadBooks() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(API);
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("API URL:", API);
      console.error("Backend error:", err);

      setError(err.message || "Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  // Search books
  const filteredBooks = useMemo(() => {
    const term = search.toLowerCase().trim();

    return books.filter((book) =>
      [
        book.title,
        book.author,
        book.isbn,
        book.category,
      ].some((value) =>
        (value || "").toLowerCase().includes(term)
      )
    );
  }, [books, search]);

  // Handle form input
  function changeField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // Add or update book
  async function submitBook(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const url = editingId
        ? `${API}/${editingId}`
        : API;

      const data = await apiRequest(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });

      setMessage(
        editingId
          ? "Book updated successfully."
          : "Book added successfully."
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadBooks();
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Could not save book.");
    }
  }

  // Edit book
  function startEdit(book) {
    setEditingId(book._id);

    setForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      category: book.category || "General",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Cancel edit
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  // Delete book
  async function deleteBook(id) {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await apiRequest(`${API}/${id}`, {
        method: "DELETE",
      });

      setMessage("Book deleted successfully.");

      if (editingId === id) {
        cancelEdit();
      }

      await loadBooks();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Could not delete book.");
    }
  }

  // Change book availability
  async function toggleAvailability(book) {
    setMessage("");
    setError("");

    try {
      await apiRequest(`${API}/${book._id}`, {
        method: "PUT",
        body: JSON.stringify({
          available: !book.available,
        }),
      });

      setMessage("Book status updated successfully.");

      await loadBooks();
    } catch (err) {
      console.error("Status error:", err);
      setError(err.message || "Could not update availability.");
    }
  }

  return (
    <main className="page">

      {/* Header */}
      <header className="hero">
        <div className="brand-mark">📚</div>

        <div>
          <p className="eyebrow">
            BOOKS • KNOWLEDGE • COMMUNITY
          </p>

          <h1>Library Management</h1>

          <p className="subtitle">
            A simple place to organize your library collection.
          </p>
        </div>
      </header>

      {/* Statistics */}
      <section className="stats">

        <article className="stat-card">
          <span>Total books</span>
          <strong>{books.length}</strong>
        </article>

        <article className="stat-card">
          <span>Available</span>
          <strong>
            {books.filter((b) => b.available).length}
          </strong>
        </article>

        <article className="stat-card">
          <span>Borrowed</span>
          <strong>
            {books.filter((b) => !b.available).length}
          </strong>
        </article>

      </section>

      {/* Messages */}
      {message && (
        <div className="notice success">
          {message}
        </div>
      )}

      {error && (
        <div className="notice error">
          {error}
          <button
            className="button secondary"
            type="button"
            onClick={loadBooks}
          >
            Retry
          </button>
        </div>
      )}

      {/* Add Book Form */}
      <section className="panel">

        <div className="section-heading">

          <div>
            <p className="eyebrow">
              COLLECTION DETAILS
            </p>

            <h2>
              {editingId ? "Edit book" : "Add a book"}
            </h2>
          </div>

          {editingId && (
            <button
              className="button secondary"
              type="button"
              onClick={cancelEdit}
            >
              Cancel edit
            </button>
          )}

        </div>

        <form
          className="book-form"
          onSubmit={submitBook}
        >

          <label>
            Book title *

            <input
              name="title"
              value={form.title}
              onChange={changeField}
              placeholder="e.g. The Alchemist"
              required
            />
          </label>

          <label>
            Author *

            <input
              name="author"
              value={form.author}
              onChange={changeField}
              placeholder="e.g. Paulo Coelho"
              required
            />
          </label>

          <label>
            ISBN

            <input
              name="isbn"
              value={form.isbn}
              onChange={changeField}
              placeholder="ISBN (optional)"
            />
          </label>

          <label>
            Category

            <input
              name="category"
              value={form.category}
              onChange={changeField}
              placeholder="e.g. Fiction"
            />
          </label>

          <button
            className="button primary form-button"
            type="submit"
          >
            {editingId ? "Save changes" : "+ Add book"}
          </button>

        </form>
      </section>

      {/* Book Collection */}
      <section className="panel">

        <div className="section-heading list-heading">

          <div>
            <p className="eyebrow">
              YOUR SHELVES
            </p>

            <h2>
              Book collection{" "}
              <span className="count">
                {filteredBooks.length}
              </span>
            </h2>
          </div>

          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, author, ISBN..."
          />

        </div>

        {loading ? (

          <p className="empty">
            Loading books...
          </p>

        ) : filteredBooks.length === 0 ? (

          <div className="empty">
            <span>📖</span>
            <h3>No books found</h3>
            <p>
              Add a book above or try a different search.
            </p>
          </div>

        ) : (

          <div className="table-wrap">

            <table>

              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredBooks.map((book) => (

                  <tr key={book._id}>

                    <td className="book-title">
                      {book.title}
                    </td>

                    <td>{book.author}</td>

                    <td>{book.isbn || "—"}</td>

                    <td>{book.category || "General"}</td>

                    <td>

                      <button
                        type="button"
                        className={`status ${
                          book.available
                            ? "available"
                            : "borrowed"
                        }`}
                        onClick={() =>
                          toggleAvailability(book)
                        }
                        title="Click to change status"
                      >
                        {book.available
                          ? "Available"
                          : "Borrowed"}
                      </button>

                    </td>

                    <td className="actions">

                      <button
                        type="button"
                        className="text-button"
                        onClick={() => startEdit(book)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="text-button delete"
                        onClick={() => deleteBook(book._id)}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

      <footer>
        Library Management System · React + Express + MongoDB
      </footer>

    </main>
  );
}
