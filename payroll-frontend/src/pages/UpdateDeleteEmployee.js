import React, { useEffect, useState } from "react";

const tables = [
  "Employees",
  "Salaries",
  "Payroll",
  "BankDetails",
  "Allowances",
  "Bonuses",
  "Attendance",
  "Deductions",
  "LeaveManagement",
  "Overtime",
  "Taxation",
  "UserRoles",
  "SalaryGrades"
];

function UpdateEmployee({ employee, onClose }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [record, setRecord] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirm, setConfirm] = useState(false);

  // Fetch record for selected table
  useEffect(() => {
    if (!selectedTable) return;
    setLoading(true);
    setError("");
    setSuccess("");
    fetch(`http://localhost:5000/getRecord/${selectedTable}/${employee.employee_id}`)
      .then(res => res.json())
      .then(data => {
        setRecord(data.record || null);
        setEditData(data.record || {});
      })
      .catch(() => setError("Failed to fetch data."))
      .finally(() => setLoading(false));
  }, [selectedTable, employee.employee_id]);

  const handleEditChange = e => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    setConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setConfirm(false);
    try {
      const id = record?.employee_id || record?.salary_id || record?.payroll_id || record?.bank_detail_id || record?.allowance_id || record?.bonus_id || record?.attendance_id || record?.deduction_id || record?.leave_id || record?.overtime_id || record?.tax_id || record?.role_id || record?.grade_id;
      const res = await fetch(`http://localhost:5000/updateData/${selectedTable}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates: editData })
      });
      const data = await res.json();
      if (res.ok) setSuccess("Update successful!");
      else setError(data.error || "Update failed");
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl relative max-h-[90vh] flex flex-col">
        <button className="absolute top-2 right-4 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Update Data for {employee.first_name} {employee.last_name}</h2>
        <div className="flex gap-4 mb-4 flex-wrap">
          {tables.map(table => (
            <button key={table} className={`px-3 py-1 rounded ${selectedTable === table ? 'bg-header text-white' : 'bg-gray-200'}`} onClick={() => setSelectedTable(table)}>{table}</button>
          ))}
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {selectedTable && !loading && !record && (
          <div className="text-gray-600 mb-2">No record found for this employee in {selectedTable}.</div>
        )}
        <div className="overflow-y-auto flex-1 pr-2" style={{ maxHeight: '50vh' }}>
          {selectedTable && record && (
            <form className="flex flex-col gap-2 mt-2" onSubmit={e => { e.preventDefault(); handleUpdate(); }}>
              {Object.entries(record).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-center">
                  <label className="w-40 font-semibold">{key}</label>
                  <input className="border rounded px-2 py-1 flex-1" name={key} value={editData[key] || ""} onChange={handleEditChange} disabled={key.endsWith('_id') || key === 'employee_id'} />
                </div>
              ))}
              <div className="sticky bottom-0 bg-white pt-2 pb-2">
                <button type="submit" className="mt-4 py-2 px-4 bg-header text-white rounded-lg font-semibold shadow hover:bg-primary transition-colors duration-300 w-full">Update</button>
              </div>
            </form>
          )}
        </div>
        {success && <div className="text-green-600 mb-2">{success}</div>}
        {confirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow-xl">
              <div className="mb-4">Are you sure you want to update this data?</div>
              <div className="flex gap-4 justify-end">
                <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setConfirm(false)}>Cancel</button>
                <button className="px-4 py-2 bg-header text-white rounded" onClick={handleConfirm}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const UpdateDeleteEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updateEmp, setUpdateEmp] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (employee_id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    setMessage("");
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/deleteData/Employees/${employee_id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Employee deleted successfully!");
        setEmployees(employees.filter(emp => emp.employee_id !== employee_id));
      } else {
        setError(data.error || "Failed to delete employee");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;

  return (
    <div className="bg-card rounded-xl shadow-xl p-8 border-t-8 border-header w-full animate-slide-up overflow-x-auto">
      <h2 className="text-2xl font-bold text-header mb-4 text-center">Update/Delete Employee</h2>
      {message && <div className="text-green-600 text-center mb-4">{message}</div>}
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-header text-white">
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Contact</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.employee_id} className="border-b">
              <td className="px-4 py-2">{emp.employee_id}</td>
              <td className="px-4 py-2">{emp.first_name} {emp.last_name}</td>
              <td className="px-4 py-2">{emp.email}</td>
              <td className="px-4 py-2">{emp.contact_number}</td>
              <td className="px-4 py-2 flex gap-2">
                <button className="text-blue-600 underline" onClick={() => setUpdateEmp(emp)}>Update</button>
                <button className="text-red-600 underline" onClick={() => handleDelete(emp.employee_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {updateEmp && <UpdateEmployee employee={updateEmp} onClose={() => setUpdateEmp(null)} />}
    </div>
  );
};

export default UpdateDeleteEmployee; 