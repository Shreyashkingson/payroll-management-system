import React, { useState } from "react";

const initialState = {
  first_name: "",
  last_name: "",
  email: "",
  contact_number: "",
  date_of_birth: "",
  job_title: "",
  gender: "Male",
  address: "",
  department_id: "",
  salary: "",
  hire_date: "",
  status: "Active",
  password: "",
  overtime_hours: "",
  bonus_percentage: "",
  unpaid_leave_days: "",
  total_working_days: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  leave_type: "",
  leave_start: "",
  leave_end: "",
  role_name: "Employee",
  grade_name: "",
  minimum_salary: "",
  maximum_salary: "",
  allowance_name: "",
  allowance_amount: ""
};

// Utility to convert MM/DD/YYYY or DD/MM/YYYY to YYYY-MM-DD
function toYYYYMMDD(val) {
  if (!val) return "";
  // If already in YYYY-MM-DD, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // Try MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [mm, dd, yyyy] = val.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // Try DD/MM/YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
    const [dd, mm, yyyy] = val.split("-");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return val;
}

const AddEmployee = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = e => {
    const { name, value, type } = e.target;
    // For date fields, always convert to YYYY-MM-DD
    if (["date_of_birth", "hire_date", "leave_start", "leave_end"].includes(name)) {
      setForm({ ...form, [name]: toYYYYMMDD(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validate = () => {
    for (const key in initialState) {
      if (form[key] === "" || form[key] === undefined) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!validate()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/addEmployee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          department_id: Number(form.department_id),
          salary: Number(form.salary),
          overtime_hours: Number(form.overtime_hours),
          bonus_percentage: Number(form.bonus_percentage),
          unpaid_leave_days: Number(form.unpaid_leave_days),
          total_working_days: Number(form.total_working_days),
          minimum_salary: Number(form.minimum_salary),
          maximum_salary: Number(form.maximum_salary),
          allowance_amount: Number(form.allowance_amount)
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Employee added successfully!");
        setForm(initialState);
      } else {
        setError(data.error || "Failed to add employee");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-xl p-8 border-t-8 border-header w-full animate-slide-up max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-header mb-4 text-center">Add Employee</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <input className="border rounded px-3 py-2 flex-1" name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} required />
        </div>
        <input className="border rounded px-3 py-2" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="border rounded px-3 py-2" name="contact_number" placeholder="Contact Number" value={form.contact_number} onChange={handleChange} required />
        <input className="border rounded px-3 py-2" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} required />
        <input className="border rounded px-3 py-2" name="job_title" placeholder="Job Title" value={form.job_title} onChange={handleChange} required />
        <select className="border rounded px-3 py-2" name="gender" value={form.gender} onChange={handleChange} required>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input className="border rounded px-3 py-2" name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
        <input className="border rounded px-3 py-2" name="department_id" placeholder="Department ID" value={form.department_id} onChange={handleChange} required />
        <input className="border rounded px-3 py-2" name="salary" type="number" placeholder="Salary" value={form.salary} onChange={handleChange} required />
        <input className="border rounded px-3 py-2" name="hire_date" type="date" value={form.hire_date} onChange={handleChange} required />
        <select className="border rounded px-3 py-2" name="status" value={form.status} onChange={handleChange} required>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <input className="border rounded px-3 py-2" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <div className="flex gap-4">
          <input className="border rounded px-3 py-2 flex-1" name="overtime_hours" type="number" placeholder="Overtime Hours" value={form.overtime_hours} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="bonus_percentage" type="number" placeholder="Bonus %" value={form.bonus_percentage} onChange={handleChange} required />
        </div>
        <div className="flex gap-4">
          <input className="border rounded px-3 py-2 flex-1" name="unpaid_leave_days" type="number" placeholder="Unpaid Leave Days" value={form.unpaid_leave_days} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="total_working_days" type="number" placeholder="Total Working Days" value={form.total_working_days} onChange={handleChange} required />
        </div>
        <div className="flex gap-4">
          <input className="border rounded px-3 py-2 flex-1" name="bank_name" placeholder="Bank Name" value={form.bank_name} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="account_number" placeholder="Account Number" value={form.account_number} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="ifsc_code" placeholder="IFSC Code" value={form.ifsc_code} onChange={handleChange} required />
        </div>
        <div className="flex gap-4">
          <input className="border rounded px-3 py-2 flex-1" name="leave_type" placeholder="Leave Type" value={form.leave_type} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="leave_start" type="date" value={form.leave_start} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="leave_end" type="date" value={form.leave_end} onChange={handleChange} required />
        </div>
        <input className="border rounded px-3 py-2" name="role_name" placeholder="Role Name" value={form.role_name} onChange={handleChange} required />
        <div className="flex gap-4">
          <input className="border rounded px-3 py-2 flex-1" name="grade_name" placeholder="Grade Name" value={form.grade_name} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="minimum_salary" type="number" placeholder="Minimum Salary" value={form.minimum_salary} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="maximum_salary" type="number" placeholder="Maximum Salary" value={form.maximum_salary} onChange={handleChange} required />
        </div>
        <div className="flex gap-4">
          <input className="border rounded px-3 py-2 flex-1" name="allowance_name" placeholder="Allowance Name" value={form.allowance_name} onChange={handleChange} required />
          <input className="border rounded px-3 py-2 flex-1" name="allowance_amount" type="number" placeholder="Allowance Amount" value={form.allowance_amount} onChange={handleChange} required />
        </div>
        <button type="submit" className="py-2 px-4 bg-header text-white rounded-lg font-semibold shadow hover:bg-primary transition-colors duration-300" disabled={loading}>
          {loading ? "Adding..." : "Add Employee"}
        </button>
        {message && <div className="text-green-600 text-center">{message}</div>}
        {error && <div className="text-red-600 text-center">{error}</div>}
      </form>
    </div>
  );
};

export default AddEmployee; 