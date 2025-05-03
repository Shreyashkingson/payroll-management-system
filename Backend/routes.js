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
        overtime_hours = 0, bonus_percentage = 0, unpaid_leave_days = 0, total_working_days = config.totalWorkingDays,
        bank_name, account_number, ifsc_code, leave_type, leave_start, leave_end, role_name, grade_name, minimum_salary, maximum_salary, allowance_name, allowance_amount
    } = req.body;

    if (!first_name || !last_name || !email || !contact_number || !date_of_birth || !job_title || !gender || !address || !department_id || !salary || !hire_date || !status || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const numericFields = [department_id, salary, overtime_hours, bonus_percentage, unpaid_leave_days, total_working_days];
    for (let field of numericFields) {
        if (typeof field !== 'number' || field < 0) {
            return res.status(400).json({ error: "Numeric fields must be numbers and greater or equals to 0." });
        }
    }

    const stringFields = [bank_name, account_number, ifsc_code, leave_type, role_name, job_title, grade_name, allowance_name];
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
            const overtimePay = (overtime_hours * (basicSalary / config.monthlyWorkHours)) * config.overtimeRate;
            const bonus = basicSalary * (bonus_percentage / 100);
            const grossSalary = basicSalary + overtimePay + bonus;
            const taxDeduction = grossSalary * config.taxRate;
            const totalDeductions = taxDeduction + config.insurancePremium + config.loanRepayment;
            const netSalary = grossSalary - totalDeductions;
            const unpaidLeaveAdjustment = unpaid_leave_days * (basicSalary / 30);
            const days = total_working_days || config.totalWorkingDays;
            const ratePerHour = salary / (days * 8);

            const queries = [
                { sql: `INSERT INTO Salaries (employee_id, basic_salary, gross_salary, net_salary) VALUES (?, ?, ?, ?)`,
                  values: [employeeId, basicSalary, grossSalary, netSalary] },
                { sql: `INSERT INTO Payroll (employee_id, total_earnings, total_deductions, net_salary, payroll_date) VALUES (?, ?, ?, ?, CURRENT_DATE)`,
                  values: [employeeId, grossSalary, totalDeductions, netSalary] },
                { sql: `INSERT INTO Taxation (employee_id, tax_amount, tax_percentage, tax_year) VALUES (?, ?, ?, YEAR(CURRENT_DATE))`,
                  values: [employeeId, taxDeduction, config.taxRate * 100] },
                 { sql: `INSERT INTO Deductions (employee_id, tax, insurance, loan_repayment, total_deductions, deduction_name, amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    values: [employeeId, taxDeduction, config.insurancePremium, config.loanRepayment, totalDeductions, "default_deduction", totalDeductions]},
                 { sql: `INSERT INTO UserRoles (employee_id, role_name) VALUES (?, ?)`,
                  values: [employeeId, role_name || 'Employee'] },

            ];

            if (overtime_hours > 0) {
                queries.push({
                sql: `INSERT INTO Overtime (employee_id, overtime_hours, rate_per_hour, overtime_pay, overtime_date, total_amount) VALUES (?, ?, ?, ?, CURRENT_DATE, ?)`,
                values: [employeeId, overtime_hours, ratePerHour, overtimePay, overtimePay]
                 });
            }

             if (bonus > 0) {
                queries.push({ sql: `INSERT INTO Bonuses (employee_id, bonus_amount) VALUES (?, ?)`,
                 values: [employeeId, bonus] });
            }
            if (unpaid_leave_days > 0) {
                queries.push({
                sql: `INSERT INTO Attendance (employee_id, unpaid_leave_days, salary_adjustment, attendance_date) VALUES (?, ?, ?, CURRENT_DATE)`,
                values: [employeeId, unpaid_leave_days, unpaidLeaveAdjustment]
             });
           }
            if (bank_name && account_number && ifsc_code) {
                queries.push({
                    sql: `INSERT INTO BankDetails (employee_id, bank_name, account_number, ifsc_code) VALUES (?, ?, ?, ?)`,
                    values: [employeeId, bank_name, account_number, ifsc_code]
                });
            }

            if (leave_type && leave_start && leave_end) {
                queries.push({
                    sql: `INSERT INTO LeaveManagement (employee_id, leave_type, leave_start, leave_end, status) VALUES (?, ?, ?, ?, 'Pending')`,
                    values: [employeeId, leave_type, leave_start, leave_end]
                });
            }

             if (allowance_name && allowance_amount) {
                queries.push({
                    sql: `INSERT INTO Allowances (employee_id, allowance_name, amount) VALUES (?, ?, ?)`,
                    values: [employeeId, allowance_name, allowance_amount]
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

export default router;