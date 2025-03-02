const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",      // Your MySQL server (default is localhost)
    user: "root",           // Your MySQL username
    password: "shreyash",           // Your MySQL password (leave blank if none)
    database: "payroll_management_system"  // Replace with your actual database name
});

db.connect((err) => {
    if (err) {
        console.error("Database Connection Failed: ", err);
        return;
    }
    console.log("Connected to MySQL Database");
});

module.exports = db;
