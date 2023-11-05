import { db } from "."

const bcrypt = require('bcrypt');
const saltRounds = 10;

const generatePassword = async (password: string) => {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

const createTable = async () => {
    const query = `CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        password VARCHAR(255),
        surname VARCHAR(255),
        email VARCHAR(255),
    )`;
    return db.query(query, []);
}

const createCSRF = async () => {
    const query = `CREATE TABLE IF NOT EXISTS csrfexample(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        account_balance FLOAT
    )`;
    return db.query(query, []);
}

const generateTestCSRF = async () => {
    await createCSRF();

    const users = [
        { name: 'Đuro', account_balance: 100000 },
        { name: 'Pero', account_balance: 150 },
        { name: 'Lopuža', account_balance: 0 }
    ];

    const promises = users.map(async (user) => {
        const { name, account_balance } = user;
        const query = 'INSERT INTO csrfexample(name, account_balance) VALUES ($1, $2)';
        const values = [name, account_balance];
        return db.query(query, values);
    });

    return Promise.all(promises);
}

const generateTestUsers = async () => {
    await createTable();

    const users = [
        { name: 'John', surname: 'Doe', email: 'johndoe@example.com', password: 'password1' },
        { name: 'Jane', surname: 'Doe', email: 'janedoe@example.com', password: 'password2' },
        { name: 'Bob', surname: 'Smith', email: 'bobsmith@example.com', password: 'password3' },
        { name: 'Alice', surname: 'Johnson', email: 'alicejohnson@example.com', password: 'password4' },
        { name: 'David', surname: 'Lee', email: 'davidlee@example.com', password: 'password5' },
    ];

    const promises = users.map(async (user) => {
        const { name, surname, email, password } = user;
        const hashedPassword = await generatePassword(password);
        const query = 'INSERT INTO users(name, surname, email, password) VALUES ($1, $2, $3, $4)';
        const values = [name, surname, email, hashedPassword];
        return db.query(query, values);
    });

    return Promise.all(promises);
}



/*generateTestUsers()
    .then(() => {
        console.log('Test users inserted successfully');
        db.pool.end();
    })
    .catch(err => {
        console.log(err);
        db.pool.end();
    });*/

generateTestCSRF()
    .then(() => {
        console.log('Test CSRF users inserted successfully');
        db.pool.end();
    })
    .catch(err => {
        console.log(err);
        db.pool.end();
    });


