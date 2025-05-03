import React from "react";

const Landing = ({ onAdminClick, onEmployeeClick }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-mainbg transition-colors duration-700">
    <header className="w-full py-6 bg-header shadow-lg text-center">
      <h1 className="text-4xl font-bold text-white tracking-wide animate-fade-in">Payroll Management System</h1>
      <p className="text-accent mt-2 animate-fade-in-slow">Manage your payroll with style ✨</p>
    </header>
    <main className="flex flex-1 flex-col items-center justify-center w-full px-4">
      <div className="flex flex-col md:flex-row gap-8 mt-12 animate-slide-up">
        {/* Admin Login Card */}
        <div className="bg-card rounded-xl shadow-xl p-8 border-t-8 border-header w-80 hover:scale-105 transform transition-all duration-300">
          <div className="flex flex-col items-center mb-4">
            <span className="text-5xl text-header mb-2"><i className="fas fa-user-shield"></i></span>
            <h2 className="text-2xl font-semibold text-header mb-1">Admin Login</h2>
            <p className="text-body text-center text-sm mb-4">Access administrative functions and manage employee records</p>
          </div>
          <button onClick={onAdminClick} className="w-full py-2 px-4 bg-primary text-white rounded-lg font-semibold shadow hover:bg-header transition-colors duration-300">Login as Admin →</button>
        </div>
        {/* Employee Login Card */}
        <div className="bg-card rounded-xl shadow-xl p-8 border-t-8 border-primary w-80 hover:scale-105 transform transition-all duration-300">
          <div className="flex flex-col items-center mb-4">
            <span className="text-5xl text-primary mb-2"><i className="fas fa-user-tie"></i></span>
            <h2 className="text-2xl font-semibold text-primary mb-1">Employee Login</h2>
            <p className="text-body text-center text-sm mb-4">View your salary details and personal information</p>
          </div>
          <button onClick={onEmployeeClick} className="w-full py-2 px-4 bg-header text-white rounded-lg font-semibold shadow hover:bg-primary transition-colors duration-300">Login as Employee →</button>
        </div>
      </div>
    </main>
    <footer className="w-full py-4 bg-header text-center text-xs text-white mt-8 animate-fade-in-slow">
      © 2024 Payroll Management System. All rights reserved.
    </footer>
    {/* Animations */}
    <style>{`
      .animate-fade-in { animation: fadeIn 1s ease; }
      .animate-fade-in-slow { animation: fadeIn 2s ease; }
      .animate-slide-up { animation: slideUp 1s cubic-bezier(.4,2,.6,1); }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  </div>
);

export default Landing; 