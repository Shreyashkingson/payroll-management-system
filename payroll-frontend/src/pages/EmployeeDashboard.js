import React from "react";
import { useLocation } from "react-router-dom";

const EmployeeDashboard = () => {
  const location = useLocation();
  const employee = location.state?.employee;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-mainbg animate-fade-in">
      <div className="bg-card rounded-xl shadow-xl p-10 border-t-8 border-primary w-full max-w-2xl animate-slide-up">
        <h2 className="text-3xl font-bold text-primary mb-4 text-center">Employee Dashboard</h2>
        <p className="text-body text-center mb-6">
          Welcome{employee ? `, ${employee.first_name} ${employee.last_name}` : ""}! 🎉<br/>
          This is your dashboard. You can view your salary details and personal information here.
        </p>
        {/* Add employee dashboard features here */}
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

export default EmployeeDashboard; 