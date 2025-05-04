import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

function PayslipModal({ employeeId, onClose }) {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/getPayslip/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        setPayslip(data.payslip);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch payslip.");
        setLoading(false);
      });
  }, [employeeId]);

  const handleDownloadPDF = () => {
    if (!payslip) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Payslip", 105, 15, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Name: ${payslip.first_name} ${payslip.last_name}`, 20, 35);
    doc.text(`Job Title: ${payslip.job_title}`, 20, 45);
    doc.text(`Department: ${payslip.department_name}`, 20, 55);
    doc.text(`Payslip Date: ${payslip.payslip_date}`, 20, 65);
    doc.text(`Gross Salary: ₹${payslip.gross_salary}`, 20, 75);
    doc.text(`Net Salary: ₹${payslip.net_salary}`, 20, 85);
    // Add more fields as needed
    doc.save(`Payslip_${payslip.first_name}_${payslip.last_name}_${payslip.payslip_date}.pdf`);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!payslip) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-xl p-8 w-full max-w-lg relative border-2 border-accent">
        <button className="absolute top-2 right-4 text-xl text-white" onClick={onClose}>&times;</button>
        <div className="flex justify-center mb-6">
          <span className="bg-panel text-header text-2xl font-extrabold px-8 py-2 rounded-full shadow border-2 border-accent text-center">Payslip</span>
        </div>
        <div className="bg-panel rounded-lg p-6 shadow-inner flex flex-col gap-2">
          <div className="flex gap-2"><span className="font-bold text-header">Name:</span><span className="font-bold text-header">{payslip.first_name} {payslip.last_name}</span></div>
          <div className="flex gap-2"><span className="font-bold text-header">Job Title:</span><span className="font-bold text-header">{payslip.job_title}</span></div>
          <div className="flex gap-2"><span className="font-bold text-header">Department:</span><span className="font-bold text-header">{payslip.department_name}</span></div>
          <div className="flex gap-2"><span className="font-bold text-header">Payslip Date:</span><span className="font-bold text-header">{payslip.payslip_date}</span></div>
          <div className="flex gap-2"><span className="font-bold text-header">Gross Salary:</span><span className="font-bold text-header">₹{payslip.gross_salary}</span></div>
          <div className="flex gap-2"><span className="font-bold text-header">Net Salary:</span><span className="font-bold text-header">₹{payslip.net_salary}</span></div>
        </div>
        <button
          className="mt-6 py-2 px-4 bg-header text-white rounded-lg font-semibold shadow hover:bg-primary transition-colors duration-300 w-full"
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}

const ViewEmployeeDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPayslip, setShowPayslip] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("http://localhost:5000/getAllEmployees");
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        setEmployees(data.employees || []);
      } catch (err) {
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;

  return (
    <div className="bg-card rounded-xl shadow-xl p-8 border-t-8 border-green w-full animate-slide-up overflow-x-auto font-display">
      <h2 className="text-2xl font-extrabold text-green mb-4 text-center font-display">Employee Details</h2>
      <table className="min-w-full table-auto border-collapse font-body">
        <thead>
          <tr className="bg-header text-white">
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">First Name</th>
            <th className="px-4 py-2">Last Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Contact</th>
            <th className="px-4 py-2">DOB</th>
            <th className="px-4 py-2">Job Title</th>
            <th className="px-4 py-2">Gender</th>
            <th className="px-4 py-2">Address</th>
            <th className="px-4 py-2">Department</th>
            <th className="px-4 py-2">Salary</th>
            <th className="px-4 py-2">Hire Date</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Payslip</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.employee_id} className="border-b">
              <td className="px-4 py-2">{emp.employee_id}</td>
              <td className="px-4 py-2">{emp.first_name}</td>
              <td className="px-4 py-2">{emp.last_name}</td>
              <td className="px-4 py-2">{emp.email}</td>
              <td className="px-4 py-2">{emp.contact_number}</td>
              <td className="px-4 py-2">{emp.date_of_birth}</td>
              <td className="px-4 py-2">{emp.job_title}</td>
              <td className="px-4 py-2">{emp.gender}</td>
              <td className="px-4 py-2">{emp.address}</td>
              <td className="px-4 py-2">{emp.department_name || emp.department || ""}</td>
              <td className="px-4 py-2">₹{emp.salary}</td>
              <td className="px-4 py-2">{emp.hire_date}</td>
              <td className="px-4 py-2">{emp.status}</td>
              <td className="px-4 py-2">
                <button className="text-primary underline" onClick={() => setShowPayslip(emp.employee_id)}>
                  View Payslip
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showPayslip && <PayslipModal employeeId={showPayslip} onClose={() => setShowPayslip(null)} />}
    </div>
  );
};

export default ViewEmployeeDetails; 