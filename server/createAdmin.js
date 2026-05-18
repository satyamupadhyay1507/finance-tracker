const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {

        const connection = await mysql.createConnection(
            'mysql://root:bTtPdogqBfKcwFhHZffS1wkKQRWgVKDe@autorack.proxy.rlwy.net:41802/railway'
        );

        const hashedPassword = await bcrypt.hash('password123', 10);

        console.log('HASH:', hashedPassword);

        await connection.execute('DELETE FROM users');

        await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [
                'Admin User',
                'admin@demo.com',
                hashedPassword,
                'admin'
            ]
        );

        console.log('Admin created successfully');
        console.log('Email: admin@demo.com');
        console.log('Password: password123');

        process.exit();

    } catch (error) {
        console.log(error);
    }
}

createAdmin();