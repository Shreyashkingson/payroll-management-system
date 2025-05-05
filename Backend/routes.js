import { Router } from "express";
const router = Router();
import { beginTransaction, query, rollback, commit } from "./database.js";

const config = {
    overtimeRate: 1.5,
    monthlyWorkHours: 160,
    taxRate: 0.1,
    insurancePremium: 100,
    loanRepayment: 200,
    totalWorkingDays: 20
};

router.post("/addEmployee", (req, res) => {
    console.log("Received Data:", req.body);

    const {
        first_name, last_name, email, contact_number, date_of_birth, job_title,
        gender, address, department_id, salary, hire_date, status,
        password,
        bank_name, account_number, ifsc_code, role_name, grade_name, minimum_salary, maximum_salary
    } = req.body;

    if (!first_name || !last_name || !email || !contact_number || !date_of_birth || !job_title || !gender || !address || !department_id || !salary || !hire_date || !status || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const numericFields = [department_id, salary];
    for (let field of numericFields) {
        if (typeof field !== 'number' || field < 0) {
            return res.status(400).json({ error: "Numeric fields must be numbers and greater or equals to 0." });
        }
    }

    const stringFields = [bank_name, account_number, ifsc_code, role_name, job_title, grade_name];
    for (let field of stringFields) {
        if (field !== undefined && typeof field !== 'string') {
            return res.status(400).json({ error: "String fields must be strings." });
        }
    }
    
    beginTransaction((err) => {
        if (err) return res.status(500).json({ error: "Transaction Error", details: err.message });

        const employeeSql = `INSERT INTO Employees 
            (first_name, last_name, email, contact_number, date_of_birth, job_title, gender, address, department_id, salary, hire_date, status, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        query(employeeSql, [first_name, last_name, email, contact_number, date_of_birth, job_title, gender, address, department_id, salary, hire_date, status, password], (err, result) => {
            if (err) return rollback(() => res.status(500).json({ error: err.message }));

            const employeeId = result.insertId;
            console.log("Inserted Employee ID:", employeeId);

            const basicSalary = salary;
            const grossSalary = basicSalary;
            const taxDeduction = grossSalary * 0.1; // 10% tax
            const totalDeductions = taxDeduction + 100 + 200; // insurancePremium + loanRepayment
            const netSalary = grossSalary - totalDeductions;

            const queries = [
                { sql: `INSERT INTO Salaries (employee_id, basic_salary, gross_salary, net_salary) VALUES (?, ?, ?, ?)`,
                  values: [employeeId, basicSalary, grossSalary, netSalary] },
                { sql: `INSERT INTO Payroll (employee_id, total_earnings, total_deductions, net_salary, payroll_date) VALUES (?, ?, ?, ?, CURRENT_DATE)`,
                  values: [employeeId, grossSalary, totalDeductions, netSalary] },
                { sql: `INSERT INTO Taxation (employee_id, tax_amount, tax_percentage, tax_year) VALUES (?, ?, ?, YEAR(CURRENT_DATE))`,
                  values: [employeeId, taxDeduction, 10] },
                 { sql: `INSERT INTO Deductions (employee_id, tax, insurance, loan_repayment, total_deductions, deduction_name, amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    values: [employeeId, taxDeduction, 100, 200, totalDeductions, "default_deduction", totalDeductions]},
                 { sql: `INSERT INTO UserRoles (employee_id, role_name) VALUES (?, ?)`,
                  values: [employeeId, role_name || 'Employee'] },
            ];

            if (bank_name && account_number && ifsc_code) {
                queries.push({
                    sql: `INSERT INTO BankDetails (employee_id, bank_name, account_number, ifsc_code) VALUES (?, ?, ?, ?)`,
                    values: [employeeId, bank_name, account_number, ifsc_code]
                });
            }

            // Add a record in JobTitles if not already exists.
            queries.push({ sql: `INSERT IGNORE INTO JobTitles (job_title_name) VALUES (?)`,
                  values: [job_title] });
            // Add a record in Payslips table
            queries.push({
                sql: `INSERT INTO PaySlips (employee_id, payroll_id, payslip_date) VALUES (?, (SELECT payroll_id from Payroll WHERE employee_id=?), CURRENT_DATE)`,
                values: [employeeId, employeeId]
             });
            if (grade_name) {
                 // Add a record in SalaryGrades if not already exists.
                 queries.push({
                    sql: `INSERT IGNORE INTO SalaryGrades (grade_name, minimum_salary, maximum_salary) VALUES (?, ?, ?)`,
                    values: [grade_name, minimum_salary, maximum_salary]
                 });
            }

            let counter = 0;
            queries.forEach(({ sql, values }) => {
                query(sql, values, (err) => {
                    if (err) return rollback(() => res.status(500).json({ error: "Insertion Failed", details: err.message }));
                    counter++;
                    if (counter === queries.length) {
                        commit((err) => {
                            if (err) return rollback(() => res.status(500).json({ error: "Commit Failed", details: err.message }));
                            res.json({ message: "Employee added successfully with full payroll processing!", employeeId });
                        });
                    }
                });
            });
        });
    });
});

// New route: /checkEmployeeData
router.get("/checkEmployeeData/:employeeId", (req, res) => {
    const { employeeId } = req.params;

    const tablesToCheck = [
        "Employees",
        "Salaries",
        "Payroll",
        "Taxation",
        "Deductions",
        "Overtime",
        "Bonuses",
        "Attendance",
        "BankDetails",
        "LeaveManagement",
        "UserRoles",
        "SalaryGrades",
        "Allowances",
        "PaySlips",
         "JobTitles"
    ];

    const checkPromises = tablesToCheck.map(table => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(*) AS count FROM ${table} WHERE employee_id = ?`;
             if (table === "JobTitles") {
                query(`SELECT COUNT(*) AS count FROM ${table} WHERE job_title_name = (SELECT job_title from Employees WHERE employee_id = ?)`, [employeeId], (err, result) => {
                    if (err) {
                        reject({ table, error: err.message });
                    } else {
                        resolve({ table, exists: result[0].count > 0 });
                    }
                });
            } else if (table == "PaySlips") {
                 query(`SELECT COUNT(*) AS count FROM ${table} WHERE employee_id = ? AND payroll_id = (SELECT payroll_id from Payroll WHERE employee_id=?)`, [employeeId, employeeId], (err, result) => {
                    if (err) {
                        reject({ table, error: err.message });
                    } else {
                        resolve({ table, exists: result[0].count > 0 });
                    }
                });
            } else {
                query(sql, [employeeId], (err, result) => {
                    if (err) {
                        reject({ table, error: err.message });
                    } else {
                        resolve({ table, exists: result[0].count > 0 });
                    }
                });
            }
        });
    });

    Promise.allSettled(checkPromises)
        .then(results => {
            const response = {};
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    response[result.value.table] = result.value.exists;
                } else {
                    response[result.reason.table] = { error: result.reason.error };
                }
            });
            res.json(response);
        })
        .catch(error => {
            console.error("Error in checkEmployeeData:", error);
            res.status(500).json({ error: "Failed to check employee data", details: error.message });
        });
});

// Admin Login Endpoint
router.post("/loginAdmin", (req, res) => {
    const { username, password } = req.body;
    // For demo: hardcoded admin credentials
    if (username === "admin" && password === "admin123") {
        return res.json({ success: true, role: "admin" });
    } else {
        return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }
});

// Employee Login Endpoint
router.post("/loginEmployee", (req, res) => {
    const { employee_id, password } = req.body;
    const sql = "SELECT * FROM Employees WHERE employee_id = ?";
    query(sql, [employee_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Employee not found" });
        }
        // In production, use bcrypt.compare(password, results[0].password)
        if (password === results[0].password) {
            return res.json({ success: true, role: "employee", employee: results[0] });
        } else {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
    });
});

// Update data in a specific table
router.put("/updateData/:tableName", (req, res) => {
    const { tableName } = req.params;
    const { id, updates } = req.body;

    if (!id || !updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "ID and updates are required" });
    }

    // Get the primary key column name based on the table
    let idColumn;
    switch (tableName) {
        case 'Employees':
            idColumn = 'employee_id';
            break;
        case 'Salaries':
            idColumn = 'salary_id';
            break;
        case 'Payroll':
            idColumn = 'payroll_id';
            break;
        // Add more cases for other tables as needed
        default:
            return res.status(400).json({ error: "Invalid table name" });
    }

    const updateFields = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
    
    const values = [...Object.values(updates), id];

    const sql = `UPDATE ${tableName} SET ${updateFields} WHERE ${idColumn} = ?`;

    query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Update failed", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No record found with the given ID" });
        }
        res.json({ message: "Update successful", affectedRows: result.affectedRows });
    });
});

// Delete data from a specific table
router.delete("/deleteData/:tableName/:id", (req, res) => {
    const { tableName, id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "ID is required" });
    }

    // Get the primary key column name based on the table
    let idColumn;
    switch (tableName) {
        case 'Employees':
            idColumn = 'employee_id';
            break;
        case 'Salaries':
            idColumn = 'salary_id';
            break;
        case 'Payroll':
            idColumn = 'payroll_id';
            break;
        // Add more cases for other tables as needed
        default:
            return res.status(400).json({ error: "Invalid table name" });
    }

    const sql = `DELETE FROM ${tableName} WHERE ${idColumn} = ?`;

    query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Delete failed", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No record found with the given ID" });
        }
        res.json({ message: "Delete successful", affectedRows: result.affectedRows });
    });
});

// Get all employees
router.get("/getAllEmployees", (req, res) => {
    const sql = `
      SELECT e.*, d.department_name
      FROM Employees e
      LEFT JOIN Departments d ON e.department_id = d.department_id
    `;
    query(sql, [], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ employees: results });
    });
  });


  // Get a single record for an employee from a specific table
router.get("/getRecord/:tableName/:employeeId", (req, res) => {
    const { tableName, employeeId } = req.params;

    // Map table to its primary key and employee reference
    const tableMap = {
        Employees: { pk: "employee_id", where: "employee_id" },
        Salaries: { pk: "salary_id", where: "employee_id" },
        Payroll: { pk: "payroll_id", where: "employee_id" },
        BankDetails: { pk: "bank_detail_id", where: "employee_id" },
        Allowances: { pk: "allowance_id", where: "employee_id" },
        Bonuses: { pk: "bonus_id", where: "employee_id" },
        Attendance: { pk: "attendance_id", where: "employee_id" },
        Deductions: { pk: "deduction_id", where: "employee_id" },
        LeaveManagement: { pk: "leave_id", where: "employee_id" },
        Overtime: { pk: "overtime_id", where: "employee_id" },
        Taxation: { pk: "tax_id", where: "employee_id" },
        UserRoles: { pk: "role_id", where: "employee_id" },
        SalaryGrades: { pk: "grade_id", where: "employee_id" }
    };

    if (!tableMap[tableName]) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    // For tables with potentially multiple records per employee, just return the first one (or you can return all as an array)
    const sql = `SELECT * FROM ${tableName} WHERE ${tableMap[tableName].where} = ? LIMIT 1`;

    query(sql, [employeeId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ error: "No record found" });
        }
        res.json({ record: results[0] });
    });
});

// Get payslip for an employee (latest)
router.get("/getPayslip/:employeeId", (req, res) => {
    const { employeeId } = req.params;
    const sql = `
      SELECT p.*, e.first_name, e.last_name, e.job_title, e.department_id, s.gross_salary, s.net_salary, d.department_name
      FROM PaySlips p
      JOIN Employees e ON p.employee_id = e.employee_id
      JOIN Salaries s ON s.employee_id = e.employee_id
      LEFT JOIN Departments d ON e.department_id = d.department_id
      WHERE p.employee_id = ?
      ORDER BY p.payslip_date DESC
      LIMIT 1
    `;
    query(sql, [employeeId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "No payslip found" });
        res.json({ payslip: results[0] });
    });
});

// Get payroll history for an employee (for salary trends)
router.get("/getPayrollHistory/:employeeId", (req, res) => {
    const { employeeId } = req.params;
    const sql = `SELECT payroll_id, total_earnings, total_deductions, net_salary, payroll_date FROM Payroll WHERE employee_id = ? ORDER BY payroll_date ASC`;
    query(sql, [employeeId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ payrollHistory: results });
    });
});

// Get all records for an employee from a specific table
router.get("/getAllRecords/:tableName/:employeeId", (req, res) => {
    const { tableName, employeeId } = req.params;
    // Map table to its primary key, employee reference, and order by field
    const tableMap = {
                Employees: { pk: "employee_id", where: "employee_id", order: "employee_id" },
                Salaries: { pk: "salary_id", where: "employee_id", order: "salary_id" },
                Payroll: { pk: "payroll_id", where: "employee_id", order: "payroll_date" },
                BankDetails: { pk: "bank_detail_id", where: "employee_id", order: "bank_detail_id" },
                Allowances: { pk: "allowance_id", where: "employee_id", order: "allowance_id" },
                Bonuses: { pk: "bonus_id", where: "employee_id", order: "bonus_id" },
                Attendance: { pk: "attendance_id", where: "employee_id", order: "attendance_date" },
                Deductions: { pk: "deduction_id", where: "employee_id", order: "deduction_id" },
                LeaveManagement: { pk: "leave_id", where: "employee_id", order: "leave_start" },
                Overtime: { pk: "overtime_id", where: "employee_id", order: "overtime_date" },
                Taxation: { pk: "tax_id", where: "employee_id", order: "tax_year" },
                UserRoles: { pk: "role_id", where: "employee_id", order: "role_id" },
                SalaryGrades: { pk: "grade_id", where: "employee_id", order: "grade_id" }
            };
    if (!tableMap[tableName]) {
        return res.status(400).json({ error: "Invalid table name" });
    }
    const sql = `SELECT * FROM ${tableName} WHERE ${tableMap[tableName].where} = ? ORDER BY ${tableMap[tableName].order} DESC`;
    query(sql, [employeeId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ error: "No records found" });
        }
        res.json({ records: results });
    });
});

// Add a new record for an employee in a specific table
router.post("/addRecord/:tableName", (req, res) => {
    const { tableName } = req.params;
    const { employee_id, ...recordData } = req.body;

    if (!employee_id) {
        return res.status(400).json({ error: "Employee ID is required" });
    }

    // Map table to its required fields and validation rules
    const tableConfig = {
        Payroll: {
            fields: ['total_earnings', 'total_deductions', 'net_salary', 'payroll_date'],
            numericFields: ['total_earnings', 'total_deductions', 'net_salary']
        },
        Overtime: {
            fields: ['overtime_hours', 'rate_per_hour', 'overtime_pay', 'overtime_date', 'total_amount'],
            numericFields: ['overtime_hours', 'rate_per_hour', 'overtime_pay', 'total_amount']
        },
        Bonuses: {
            fields: ['bonus_amount', 'bonus_date'],
            numericFields: ['bonus_amount']
        },
        Attendance: {
            fields: ['unpaid_leave_days', 'salary_adjustment', 'attendance_date'],
            numericFields: ['unpaid_leave_days', 'salary_adjustment']
        },
        LeaveManagement: {
            fields: ['leave_type', 'leave_start', 'leave_end', 'status'],
            dateFields: ['leave_start', 'leave_end']
        },
        Deductions: {
            fields: ['tax', 'insurance', 'loan_repayment', 'total_deductions', 'deduction_name'],
            numericFields: ['tax', 'insurance', 'loan_repayment', 'total_deductions']
        },
        Allowances: {
            fields: ['allowance_name', 'amount'],
            numericFields: ['amount']
        }
    };

    if (!tableConfig[tableName]) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    // Validate required fields
    const requiredFields = tableConfig[tableName].fields;
    for (const field of requiredFields) {
        if (!(field in recordData)) {
            return res.status(400).json({ error: `Missing required field: ${field}` });
        }
    }

    // Validate numeric fields
    if (tableConfig[tableName].numericFields) {
        for (const field of tableConfig[tableName].numericFields) {
            if (isNaN(Number(recordData[field]))) {
                return res.status(400).json({ error: `${field} must be a number` });
            }
            recordData[field] = Number(recordData[field]);
        }
    }

    // Validate date fields
    if (tableConfig[tableName].dateFields) {
        for (const field of tableConfig[tableName].dateFields) {
            if (!isValidDate(recordData[field])) {
                return res.status(400).json({ error: `${field} must be a valid date` });
            }
        }
    }

    // Build the SQL query
    const fields = ['employee_id', ...requiredFields];
    const placeholders = fields.map(() => '?').join(', ');
    const values = [employee_id, ...requiredFields.map(field => recordData[field])];

    const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

    query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Failed to add record", details: err.message });
        }
        res.json({ message: "Record added successfully", id: result.insertId });
    });
});

// Helper function to validate dates
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// Get all leave requests
router.get("/getLeaveRequests", (req, res) => {
    const sql = `
        SELECT 
            l.leave_id,
            e.employee_id,
            CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
            d.department_name,
            l.leave_type,
            l.leave_start,
            l.leave_end,
            l.status,
            l.approval_notes
        FROM LeaveManagement l
        JOIN Employees e ON l.employee_id = e.employee_id
        JOIN Departments d ON e.department_id = d.department_id
        ORDER BY l.leave_start DESC
    `;
    query(sql, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ leaveRequests: results });
    });
});

// Approve leave request
router.post("/approveLeave/:leaveId", (req, res) => {
    const { leaveId } = req.params;
    const { notes } = req.body;

    beginTransaction((err) => {
        if (err) return res.status(500).json({ error: "Transaction Error", details: err.message });

        // Update leave status
        const updateLeaveSql = `
            UPDATE LeaveManagement 
            SET status = 'Approved',
                approval_notes = ?,
                approved_by = ?,
                approval_date = CURDATE()
            WHERE leave_id = ?
        `;
        query(updateLeaveSql, [notes, 1, leaveId], (err) => {
            if (err) return rollback(() => res.status(500).json({ error: err.message }));

            // Get leave details
            const getLeaveSql = `
                SELECT employee_id, leave_start, leave_end
                FROM LeaveManagement
                WHERE leave_id = ?
            `;
            query(getLeaveSql, [leaveId], (err, leave) => {
                if (err) return rollback(() => res.status(500).json({ error: err.message }));

                // Calculate leave days and salary adjustment
                const leaveDays = Math.ceil((new Date(leave[0].leave_end) - new Date(leave[0].leave_start)) / (1000 * 60 * 60 * 24)) + 1;
                
                // Get employee salary
                const getSalarySql = `
                    SELECT basic_salary
                    FROM Salaries
                    WHERE employee_id = ?
                `;
                query(getSalarySql, [leave[0].employee_id], (err, salary) => {
                    if (err) return rollback(() => res.status(500).json({ error: err.message }));

                    const dailySalary = salary[0].basic_salary / 30;
                    const salaryAdjustment = dailySalary * leaveDays;

                    // Create attendance records
                    let currentDate = new Date(leave[0].leave_start);
                    const endDate = new Date(leave[0].leave_end);
                    let attendanceQueries = [];

                    while (currentDate <= endDate) {
                        attendanceQueries.push({
                            sql: `
                                INSERT INTO Attendance (
                                    employee_id,
                                    attendance_date,
                                    clock_in_time,
                                    clock_out_time,
                                    unpaid_leave_days,
                                    salary_adjustment
                                ) VALUES (?, ?, NULL, NULL, 1, ?)
                            `,
                            values: [leave[0].employee_id, currentDate, dailySalary]
                        });
                        currentDate.setDate(currentDate.getDate() + 1);
                    }

                    // Execute attendance queries
                    let counter = 0;
                    attendanceQueries.forEach(({ sql, values }) => {
                        query(sql, values, (err) => {
                            if (err) return rollback(() => res.status(500).json({ error: err.message }));
                            counter++;
                            if (counter === attendanceQueries.length) {
                                // Update payroll
                                const updatePayrollSql = `
                                    UPDATE Payroll
                                    SET total_deductions = total_deductions + ?,
                                        net_salary = net_salary - ?
                                    WHERE employee_id = ?
                                    AND payroll_date = DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                `;
                                query(updatePayrollSql, [salaryAdjustment, salaryAdjustment, leave[0].employee_id], (err) => {
                                    if (err) return rollback(() => res.status(500).json({ error: err.message }));
                                    commit((err) => {
                                        if (err) return rollback(() => res.status(500).json({ error: "Commit Failed", details: err.message }));
                                        res.json({ message: "Leave request approved successfully" });
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    });
});

// Reject leave request
router.post("/rejectLeave/:leaveId", (req, res) => {
    const { leaveId } = req.params;
    const { notes } = req.body;

    const sql = `
        UPDATE LeaveManagement 
        SET status = 'Rejected',
            approval_notes = ?,
            approved_by = ?,
            approval_date = CURDATE()
        WHERE leave_id = ?
    `;
    query(sql, [notes, 1, leaveId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Leave request rejected successfully" });
    });
});

export default router;