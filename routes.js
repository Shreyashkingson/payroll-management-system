const express = require("express");
const router = express.Router();
const db = require("./database");

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
        overtime_hours = 0, bonus_percentage = 0, unpaid_leave_days = 0, total_working_days = config.totalWorkingDays,
        bank_name, account_number, ifsc_code, leave_type, leave_start, leave_end, role_name, grade_name, allowance_name, allowance_amount
    } = req.body;

      // Input Validation: all fields should be present.
    if (!first_name || !last_name || !email || !contact_number || !date_of_birth || !job_title || !gender || !address || !department_id || !salary || !hire_date || !status) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Input validation: check if number fields are numbers and in the right range.
    const numericFields = [department_id, salary, overtime_hours, bonus_percentage, unpaid_leave_days, total_working_days];
    for (let field of numericFields) {
        if (typeof field !== 'number' || field < 0) {
            return res.status(400).json({ error: "Numeric fields must be numbers and greater or equals to 0." });
        }
    }

   // Input validation: check if string fields are strings.
    const stringFields = [bank_name, account_number, ifsc_code, leave_type, role_name, job_title, grade_name, allowance_name];
    for (let field of stringFields) {
        if (field !== undefined && typeof field !== 'string') {
            return res.status(400).json({ error: "String fields must be strings." });
        }
    }
    
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: "Transaction Error", details: err.message });

        const employeeSql = `INSERT INTO Employees 
            (first_name, last_name, email, contact_number, date_of_birth, job_title, gender, address, department_id, salary, hire_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(employeeSql, [first_name, last_name, email, contact_number, date_of_birth, job_title, gender, address, department_id, salary, hire_date, status], (err, result) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

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
                queries.push({ sql: `INSERT INTO Bonuses (employee_id, bonus_amount, amount) VALUES (?, ?, ?)`,
                 values: [employeeId, bonus, bonus] });
            }
            if (unpaid_leave_days > 0) {
                queries.push({
                sql: `INSERT INTO Attendance (employee_id, unpaid_leave_days, salary_adjustment, date) VALUES (?, ?, ?, CURRENT_DATE)`,
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
                 queries.push({ sql: `INSERT IGNORE INTO SalaryGrades (grade_name) VALUES (?)`,
                  values: [grade_name] });
            }

            let counter = 0;
            queries.forEach(({ sql, values }) => {
                db.query(sql, values, (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: "Insertion Failed", details: err.message }));
                    counter++;
                    if (counter === queries.length) {
                        db.commit((err) => {
                            if (err) return db.rollback(() => res.status(500).json({ error: "Commit Failed", details: err.message }));
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
                db.query(`SELECT COUNT(*) AS count FROM ${table} WHERE job_title_name = (SELECT job_title from Employees WHERE employee_id = ?)`, [employeeId], (err, result) => {
                    if (err) {
                        reject({ table, error: err.message });
                    } else {
                        resolve({ table, exists: result[0].count > 0 });
                    }
                });
            } else if (table == "PaySlips") {
                 db.query(`SELECT COUNT(*) AS count FROM ${table} WHERE employee_id = ? AND payroll_id = (SELECT payroll_id from Payroll WHERE employee_id=?)`, [employeeId, employeeId], (err, result) => {
                    if (err) {
                        reject({ table, error: err.message });
                    } else {
                        resolve({ table, exists: result[0].count > 0 });
                    }
                });
            } else {
                db.query(sql, [employeeId], (err, result) => {
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

module.exports = router;
