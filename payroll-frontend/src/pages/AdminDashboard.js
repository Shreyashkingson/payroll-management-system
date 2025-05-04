import React, { useState } from "react";
import AddEmployee from "./AddEmployee";
import UpdateDeleteEmployee from "./UpdateDeleteEmployee";
import ViewEmployeeDetails from "./ViewEmployeeDetails";
import AddEmployeeRecords from "./AddEmployeeRecords";
import LeaveRequest from "../components/LeaveRequest";

const AdminDashboard = () => {
  const [selected, setSelected] = useState("view");
  return (
    <div className="min-h-screen flex flex-col items-center bg-mainbg animate-fade-in">
      <nav className="flex gap-4 mt-8 mb-8">
        <button className={`px-4 py-2 rounded-lg font-semibold shadow ${selected === 'add' ? 'bg-header text-white' : 'bg-card text-header border border-header'}`} onClick={() => setSelected('add')}>Add Employee</button>
        <button className={`px-4 py-2 rounded-lg font-semibold shadow ${selected === 'update' ? 'bg-header text-white' : 'bg-card text-header border border-header'}`} onClick={() => setSelected('update')}>Update/Delete Employee</button>
        <button className={`px-4 py-2 rounded-lg font-semibold shadow ${selected === 'view' ? 'bg-header text-white' : 'bg-card text-header border border-header'}`} onClick={() => setSelected('view')}>View Employee Details</button>
        <button className={`px-4 py-2 rounded-lg font-semibold shadow ${selected === 'records' ? 'bg-header text-white' : 'bg-card text-header border border-header'}`} onClick={() => setSelected('records')}>Add Employee Records</button>
        <button className={`px-4 py-2 rounded-lg font-semibold shadow ${selected === 'leaves' ? 'bg-header text-white' : 'bg-card text-header border border-header'}`} onClick={() => setSelected('leaves')}>Manage Leaves</button>
      </nav>
      <div className="w-full max-w-5xl">
        {selected === "add" && <AddEmployee />}
        {selected === "update" && <UpdateDeleteEmployee />}
        {selected === "view" && <ViewEmployeeDetails />}
        {selected === "records" && <AddEmployeeRecords />}
        {selected === "leaves" && <LeaveRequest />}
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 1s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default AdminDashboard; 