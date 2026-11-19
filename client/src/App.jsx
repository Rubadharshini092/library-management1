import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api/books";
const emptyForm = { title: "", author: "", isbn: "", category: "General" };

export default function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load books");
      setBooks(data);
    } catch (e) {
      setError("Could not connect to the backend. Make sure MongoDB and the server are running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBooks(); }, []);

  const filteredBooks = useMemo(() => {
    const term = search.toLowerCase();
    return books.filter((b) =>
      [b.title, b.author, b.isbn, b.category].some((v) => (v || "").toLowerCase().includes(term))
    );
  }, [books, search]);

  function changeField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submitBook(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save book");
      setMessage(editingId ? "Book updated successfully." : "Book added successfully.");
      setForm(emptyForm);
      setEditingId(null);
      await loadBooks();
    } catch (e) {
      setError(e.message || "Could not save book.");
    }
  }

  function startEdit(book) {
    setEditingId(book._id);
    setForm({
      title: book.title || "", author: book.author || "", isbn: book.isbn || "",
      category: book.category || "General"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteBook(id) {
    if (!window.confirm("Delete this book?")) return;
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete book");
      setMessage("Book deleted successfully.");
      await loadBooks();
    } catch (e) {
      setError(e.message || "Could not delete book.");
    }
  }

  async function toggleAvailability(book) {
    try {
      const response = await fetch(`${API}/${book._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !book.available })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update availability");
      await loadBooks();
    } catch (e) {
      setError(e.message || "Could not update availability.");
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="brand-mark">📚</div>
        <div>
          <p className="eyebrow">BOOKS • KNOWLEDGE • COMMUNITY</p>
          <h1>Library Management</h1>
          <p className="subtitle">A simple place to organize your library collection.</p>
        </div>
      </header>

      <section className="stats">
        <article className="stat-card"><span>Total books</span><strong>{books.length}</strong></article>
        <article className="stat-card"><span>Available</span><strong>{books.filter(b => b.available).length}</strong></article>
        <article className="stat-card"><span>Borrowed</span><strong>{books.filter(b => !b.available).length}</strong></article>
      </section>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">COLLECTION DETAILS</p><h2>{editingId ? "Edit book" : "Add a book"}</h2></div>
          {editingId && <button className="button secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel edit</button>}
        </div>
        <form className="book-form" onSubmit={submitBook}>
          <label>Book title *<input name="title" value={form.title} onChange={changeField} placeholder="e.g. The Alchemist" required /></label>
          <label>Author *<input name="author" value={form.author} onChange={changeField} placeholder="e.g. Paulo Coelho" required /></label>
          <label>ISBN<input name="isbn" value={form.isbn} onChange={changeField} placeholder="ISBN (optional)" /></label>
          <label>Category<input name="category" value={form.category} onChange={changeField} placeholder="e.g. Fiction" /></label>
          <button className="button primary form-button" type="submit">{editingId ? "Save changes" : "+ Add book"}</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading list-heading">
          <div><p className="eyebrow">YOUR SHELVES</p><h2>Book collection <span className="count">{filteredBooks.length}</span></h2></div>
          <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author, ISBN..." />
        </div>
        {loading ? <p className="empty">Loading books…</p> : filteredBooks.length === 0 ? (
          <div className="empty"><span>📖</span><h3>No books found</h3><p>Add a book above or try a different search.</p></div>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr><th>Book</th><th>Author</th><th>ISBN</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filteredBooks.map(book => (
              <tr key={book._id}>
                <td className="book-title">{book.title}</td><td>{book.author}</td><td>{book.isbn || "—"}</td><td>{book.category || "General"}</td>
                <td><button className={`status ${book.available ? "available" : "borrowed"}`} onClick={() => toggleAvailability(book)} title="Click to change status">{book.available ? "Available" : "Borrowed"}</button></td>
                <td className="actions"><button className="text-button" onClick={() => startEdit(book)}>Edit</button><button className="text-button delete" onClick={() => deleteBook(book._id)}>Delete</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      <footer>Library Management System · React + Express + MongoDB</footer>
    </main>
  );
}
