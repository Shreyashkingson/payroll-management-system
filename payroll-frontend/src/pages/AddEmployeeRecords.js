import React, { useState, useEffect } from 'react';

const recordTypes = [
  { name: 'Payroll', fields: ['total_earnings', 'total_deductions', 'net_salary', 'payroll_date'] },
  { name: 'Overtime', fields: ['overtime_hours', 'rate_per_hour', 'overtime_pay', 'overtime_date', 'total_amount'] },
  { name: 'Bonuses', fields: ['bonus_amount', 'bonus_date'] },
  { name: 'Attendance', fields: ['unpaid_leave_days', 'salary_adjustment', 'attendance_date', 'clock_in_time', 'clock_out_time'] },
  { name: 'LeaveManagement', fields: ['leave_type', 'leave_start', 'leave_end', 'status'] },
  { name: 'Deductions', fields: ['tax', 'insurance', 'loan_repayment', 'total_deductions', 'deduction_name'] },
  { name: 'Allowances', fields: ['allowance_name', 'amount'] }
];

// Utility to convert MM/DD/YYYY or DD/MM/YYYY to YYYY-MM-DD
function toYYYYMMDD(val) {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [mm, dd, yyyy] = val.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
    const [dd, mm, yyyy] = val.split("-");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return val;
}

function AddEmployeeRecords() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRecordType, setSelectedRecordType] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch all employees
    fetch('http://localhost:5000/getAllEmployees')
      .then(res => res.json())
      .then(data => {
        if (data.employees) {
          setEmployees(data.employees);
        }
      })
      .catch(err => setError('Failed to fetch employees'));
  }, []);

  // Auto-calculate total_amount for Overtime
  useEffect(() => {
    if (selectedRecordType === 'Overtime') {
      const hours = parseFloat(formData.overtime_hours) || 0;
      const rate = parseFloat(formData.rate_per_hour) || 0;
      const total = hours * rate;
      if (formData.total_amount !== String(total)) {
        setFormData(prev => ({ ...prev, total_amount: total ? String(total) : '' }));
      }
    }
    // eslint-disable-next-line
  }, [formData.overtime_hours, formData.rate_per_hour, selectedRecordType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Prevent manual edit of total_amount for Overtime
    if (selectedRecordType === 'Overtime' && name === 'total_amount') return;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedRecordType) {
      setError('Please select an employee and record type');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Convert all date fields to YYYY-MM-DD
    const dateFields = ['payroll_date', 'overtime_date', 'bonus_date', 'attendance_date', 'leave_start', 'leave_end'];
    const processedFormData = { ...formData };
    dateFields.forEach(field => {
      if (processedFormData[field]) {
        processedFormData[field] = toYYYYMMDD(processedFormData[field]);
      }
    });

    try {
      const response = await fetch(`http://localhost:5000/addRecord/${selectedRecordType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: selectedEmployee,
          ...processedFormData
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add record');
      }

      setSuccess('Record added successfully!');
      setFormData({}); // Reset form
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    const recordType = recordTypes.find(type => type.name === selectedRecordType);
    if (!recordType) return null;

    return recordType.fields.map(field => {
      // Special handling for clock_in_time and clock_out_time
      if (selectedRecordType === 'Attendance' && (field === 'clock_in_time' || field === 'clock_out_time')) {
        return (
          <div key={field} className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {field.replace(/_/g, ' ').toUpperCase()}
            </label>
            <input
              type="datetime-local"
              name={field}
              value={formData[field] || ''}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Format: YYYY-MM-DD HH:MM:SS (e.g., 2025-05-04 09:00:00)
            </p>
          </div>
        );
      }

      return (
        <div key={field} className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {field.replace(/_/g, ' ').toUpperCase()}
          </label>
          <input
            type={field.includes('date') ? 'date' : 'text'}
            name={field}
            value={formData[field] || ''}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            disabled={selectedRecordType === 'Overtime' && field === 'total_amount'}
          />
        </div>
      );
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Add Employee Records</h2>
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select an employee</option>
            {employees.map(emp => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.first_name} {emp.last_name} (ID: {emp.employee_id})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Record Type
          </label>
          <select
            value={selectedRecordType}
            onChange={(e) => {
              setSelectedRecordType(e.target.value);
              setFormData({}); // Reset form when record type changes
            }}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a record type</option>
            {recordTypes.map(type => (
              <option key={type.name} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRecordType && (
          <form onSubmit={handleSubmit}>
            {renderFormFields()}
            
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {loading ? 'Adding...' : 'Add Record'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddEmployeeRecords; 