import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaRupeeSign, FaCalendarAlt, FaFileDownload, FaUserCircle, FaRegSmile, FaUserEdit, FaEnvelopeOpenText, FaUserCheck } from "react-icons/fa";
import jsPDF from "jspdf";

const EmployeeDashboard = () => {
  const location = useLocation();
  const employee = location.state?.employee;
  const [netSalary, setNetSalary] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [lastPayslip, setLastPayslip] = useState(null);
  const [attendanceRate, setAttendanceRate] = useState(null);
  const [nextPayrollDate, setNextPayrollDate] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [profilePic, setProfilePic] = useState(null); // Placeholder for profile pic logic
  const [isBirthday, setIsBirthday] = useState(false);
  const [isAnniversary, setIsAnniversary] = useState(false);
  // Modal states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: '', leave_start: '', leave_end: '' });
  const [bankForm, setBankForm] = useState({ bank_name: '', account_number: '', ifsc_code: '' });
  const [modalMsg, setModalMsg] = useState('');

  // Fetch all info card data and recent activity
  useEffect(() => {
    if (!employee) return;
    // Net Salary (this month)
    fetch(`/getPayrollHistory/${employee.employee_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.payrollHistory && data.payrollHistory.length > 0) {
          const latest = data.payrollHistory[data.payrollHistory.length - 1];
          setNetSalary(latest.net_salary);
          setNextPayrollDate("31 May 2025"); // Placeholder, ideally from backend
          setLastPayslip({ date: latest.payroll_date, id: latest.payroll_id, ...latest });
          setRecentActivity(prev => [
            `Salary credited on ${latest.payroll_date?.slice(0, 10)}`,
            ...prev
          ]);
        }
      });
    // Leave Balance
    fetch(`/getAllRecords/LeaveManagement/${employee.employee_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.records) {
          // Example: 20 total, minus leaves taken
          const total = 20;
          const taken = data.records.length;
          setLeaveBalance(`${total - taken}/${total}`);
          data.records.forEach(record => {
            if (record.status === "Approved") {
              setRecentActivity(prev => [
                `Leave approved: ${record.leave_start?.slice(0, 10)} to ${record.leave_end?.slice(0, 10)}`,
                ...prev
              ]);
            } else if (record.status === "Rejected") {
              setRecentActivity(prev => [
                `Leave rejected: ${record.leave_start?.slice(0, 10)} to ${record.leave_end?.slice(0, 10)}`,
                ...prev
              ]);
            }
          });
        }
      });
    // Attendance Rate
    fetch(`/getAllRecords/Attendance/${employee.employee_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.records) {
          const present = data.records.filter(a => (a.unpaid_leave_days || 0) === 0).length;
          const total = data.records.length;
          setAttendanceRate(total > 0 ? `${Math.round((present / total) * 100)}%` : "N/A");
          if (total > 0) {
            setRecentActivity(prev => [
              `Attendance: ${present} present out of ${total}`,
              ...prev
            ]);
          }
        }
      });
    // Bonuses (for recent activity)
    fetch(`/getAllRecords/Bonuses/${employee.employee_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.records && data.records.length > 0) {
          setRecentActivity(prev => [
            `Bonus received: ₹${data.records[0].bonus_amount}`,
            ...prev
          ]);
        }
      });
    // Profile pic, birthday, anniversary (mock logic)
    setProfilePic(null); // Add logic if you have profile pics
    if (employee.date_of_birth) {
      const today = new Date();
      const dob = new Date(employee.date_of_birth);
      setIsBirthday(today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate());
    }
    if (employee.hire_date) {
      const today = new Date();
      const hire = new Date(employee.hire_date);
      setIsAnniversary(today.getMonth() === hire.getMonth() && today.getDate() === hire.getDate());
    }
  }, [employee]);

  // Download Payslip as PDF
  const handleDownloadPayslip = () => {
    if (!lastPayslip) return;
    const doc = new jsPDF();
    doc.text("Payslip", 10, 10);
    doc.text(`Employee: ${employee.first_name} ${employee.last_name}`, 10, 20);
    doc.text(`Net Salary: ₹${lastPayslip.net_salary}`, 10, 30);
    doc.text(`Date: ${lastPayslip.date?.slice(0, 10)}`, 10, 40);
    doc.save(`Payslip_${employee.first_name}_${lastPayslip.date?.slice(0, 10)}.pdf`);
  };

  // Apply for Leave
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setModalMsg('');
    const res = await fetch('/addRecord/LeaveManagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: employee.employee_id,
        ...leaveForm,
        status: 'Pending'
      })
    });
    const data = await res.json();
    if (res.ok) {
      setModalMsg('Leave request submitted!');
      setLeaveForm({ leave_type: '', leave_start: '', leave_end: '' });
    } else {
      setModalMsg(data.error || 'Failed to submit leave request');
    }
  };

  // Update Bank Details
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setModalMsg('');
    const res = await fetch('/updateData/BankDetails', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: employee.employee_id,
        updates: bankForm
      })
    });
    const data = await res.json();
    if (res.ok) {
      setModalMsg('Bank details updated!');
      setBankForm({ bank_name: '', account_number: '', ifsc_code: '' });
    } else {
      setModalMsg(data.error || 'Failed to update bank details');
    }
  };

  // Contact HR
  const handleContactHR = () => {
    window.location.href = 'mailto:hr@example.com?subject=HR%20Assistance%20Needed&body=Hello%20HR%2C%20I%20need%20assistance%20with...';
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-mainbg font-display py-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-green font-display flex items-center">
              Welcome, {employee?.first_name} {employee?.last_name}!
              {isBirthday && <FaRegSmile className="ml-2 text-yellow-400" title="Happy Birthday!" />}
              {isAnniversary && <FaUserCheck className="ml-2 text-blue-400" title="Work Anniversary!" />}
            </h2>
            <div className="text-body font-body">{employee?.job_title} | {employee?.email}</div>
          </div>
        </div>
        {/* Smart Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <InfoCard icon={<FaRupeeSign />} label="Net Salary" value={netSalary ? `₹${netSalary}` : "-"} />
          <InfoCard icon={<FaCalendarAlt />} label="Leave Balance" value={leaveBalance || "-"} />
          <InfoCard icon={<FaFileDownload />} label="Last Payslip" value={lastPayslip ? lastPayslip.date?.slice(0, 10) : "-"} onClick={handleDownloadPayslip} clickable />
          <InfoCard icon={<FaUserEdit />} label="Attendance" value={attendanceRate || "-"} />
          <InfoCard icon={<FaCalendarAlt />} label="Next Payroll" value={nextPayrollDate || "-"} />
        </div>
        {/* Recent Activity Timeline */}
        <div className="bg-card rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <ul className="timeline">
            {recentActivity.length === 0 ? (
              <li className="text-gray-400">No recent activity.</li>
            ) : (
              recentActivity.map((item, idx) => (
                <li key={idx} className="mb-2 flex items-center">
                  <span className="w-2 h-2 bg-green rounded-full mr-3"></span>
                  {item}
                </li>
              ))
            )}
          </ul>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <QuickAction icon={<FaFileDownload />} label="Download Payslip" onClick={handleDownloadPayslip} />
          <QuickAction icon={<FaCalendarAlt />} label="Apply for Leave" onClick={() => { setShowLeaveModal(true); setModalMsg(''); }} />
          <QuickAction icon={<FaUserEdit />} label="Update Bank Details" onClick={() => { setShowBankModal(true); setModalMsg(''); }} />
          <QuickAction icon={<FaEnvelopeOpenText />} label="Contact HR" onClick={handleContactHR} />
        </div>
        {/* Leave Modal */}
        {showLeaveModal && (
          <Modal onClose={() => setShowLeaveModal(false)} title="Apply for Leave">
            <form onSubmit={handleLeaveSubmit} className="flex flex-col gap-3">
              <input className="border rounded px-3 py-2" name="leave_type" placeholder="Leave Type" value={leaveForm.leave_type} onChange={e => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))} required />
              <input className="border rounded px-3 py-2" name="leave_start" type="date" value={leaveForm.leave_start} onChange={e => setLeaveForm(f => ({ ...f, leave_start: e.target.value }))} required />
              <input className="border rounded px-3 py-2" name="leave_end" type="date" value={leaveForm.leave_end} onChange={e => setLeaveForm(f => ({ ...f, leave_end: e.target.value }))} required />
              <button className="bg-green text-white px-4 py-2 rounded" type="submit">Submit</button>
              {modalMsg && <div className="text-center text-green-600">{modalMsg}</div>}
            </form>
          </Modal>
        )}
        {/* Bank Modal */}
        {showBankModal && (
          <Modal onClose={() => setShowBankModal(false)} title="Update Bank Details">
            <form onSubmit={handleBankSubmit} className="flex flex-col gap-3">
              <input className="border rounded px-3 py-2" name="bank_name" placeholder="Bank Name" value={bankForm.bank_name} onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))} required />
              <input className="border rounded px-3 py-2" name="account_number" placeholder="Account Number" value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))} required />
              <input className="border rounded px-3 py-2" name="ifsc_code" placeholder="IFSC Code" value={bankForm.ifsc_code} onChange={e => setBankForm(f => ({ ...f, ifsc_code: e.target.value }))} required />
              <button className="bg-green text-white px-4 py-2 rounded" type="submit">Update</button>
              {modalMsg && <div className="text-center text-green-600">{modalMsg}</div>}
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon, label, value, onClick, clickable }) => (
  <div
    className={`bg-card rounded-lg shadow p-4 flex flex-col items-center cursor-${clickable ? "pointer" : "default"} transition hover:shadow-lg`}
    onClick={clickable ? onClick : undefined}
    title={clickable ? `Click for more details` : undefined}
  >
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-lg font-bold">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

// Quick Action Button
const QuickAction = ({ icon, label, onClick }) => (
  <button
    className="flex items-center gap-2 bg-green text-white px-4 py-2 rounded shadow hover:bg-green-dark transition"
    onClick={onClick}
  >
    {icon}
    {label}
  </button>
);

// Modal Component
const Modal = ({ onClose, title, children }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-md relative">
      <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={onClose}>&times;</button>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

export default EmployeeDashboard;
