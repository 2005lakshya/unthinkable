"use client";
import { useState, useEffect } from "react";

export default function Form() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [status, setStatus] = useState("");
  const [submissions, setSubmissions] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("✅ Form submitted!");
      setForm({ name: "", email: "" });
      fetchSubmissions();
    } else {
      setStatus("❌ Failed to submit");
    }
  };

  const fetchSubmissions = async () => {
    const res = await fetch("/api/submit");
    if (res.ok) {
      setSubmissions(await res.json());
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-gray-900 text-white p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 bg-gray-800 rounded-xl shadow-lg w-full max-w-sm sm:max-w-md md:w-80 space-y-4 mb-6"
      >
        <h1 className="text-lg sm:text-xl font-bold text-center">MongoDB + Prisma Form</h1>
        <input
          className="w-full p-2 sm:p-3 rounded bg-gray-700 text-sm sm:text-base"
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="w-full p-2 sm:p-3 rounded bg-gray-700 text-sm sm:text-base"
          type="email"
          name="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="w-full p-2 sm:p-3 bg-green-600 rounded hover:bg-green-700 text-sm sm:text-base font-medium transition-colors"
        >
          Submit
        </button>
        <p className="text-sm text-center">{status}</p>
      </form>

      <div className="w-full max-w-sm sm:max-w-md bg-gray-800 p-4 sm:p-6 rounded-xl">
        <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Submissions</h2>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="p-2 sm:p-3 bg-gray-700 rounded flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0"
            >
              <span className="font-medium text-sm sm:text-base">{s.name}</span>
              <span className="text-gray-400 text-xs sm:text-sm break-all">{s.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
