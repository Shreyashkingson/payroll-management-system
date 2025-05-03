import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/loginAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        navigate("/admin-dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-mainbg animate-fade-in">
      <div className="bg-card rounded-xl shadow-xl p-8 border-t-8 border-header w-96 animate-slide-up">
        <h2 className="text-3xl font-bold text-header mb-2 text-center">Admin Login</h2>
        <p className="text-body text-center mb-6">Welcome back, admin! 🌟</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-panel rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            className="border border-panel rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-primary text-white rounded-lg font-semibold shadow hover:bg-header transition-colors duration-300">Login</button>
        </form>
        <button onClick={() => navigate("/")} className="mt-4 text-primary hover:underline text-sm">← Back to Home</button>
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 1s ease; }
        .animate-slide-up { animation: slideUp 1s cubic-bezier(.4,2,.6,1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AdminLogin; 