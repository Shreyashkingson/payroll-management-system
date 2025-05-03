import mysql from "mysql";

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

// Helper functions for transactions
export const beginTransaction = (callback) => {
    db.beginTransaction(callback);
};

export const query = (sql, values, callback) => {
    db.query(sql, values, callback);
};

export const rollback = (callback) => {
    db.rollback(callback);
};

export const commit = (callback) => {
    db.commit(callback);
};

export default db;
