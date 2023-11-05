import express from 'express';
import {db} from '../db/index.js';
import { emit } from 'process';

export const sqlRoutes = express.Router();

sqlRoutes.use(express.urlencoded({ extended: true }));

sqlRoutes.get("/", (req, res) => {
    res.render('sql_injection', {results: [] , message: ""})
});

sqlRoutes.post('/search', async (req, res) => {
    let result
    if (req.body.vulnerability === "on") {
        const name = req.body.name;
        const query = "SELECT name, surname, id, email FROM USERS WHERE (name || ' ' || surname) LIKE '%" + name + "%'";
        try {
            result = await db.query(query, [])
            res.render('sql_injection', {results: result.rows, message: ""});
        } catch (e) {
            res.render('sql_injection', {results: [], message: e});
        }
    }
    else {
        const name = req.body.name.trim();
        if (!name.match(/^[a-zA-Z ]+$/) || name.length > 50 || name.length < 1) {
            res.render('sql_injection', {results: [], message: "Uneseni podatak nije validan."});
            return;
        }
        const query = "SELECT name, surname, id, email FROM USERS WHERE (name || ' ' || surname) LIKE $1";
        const nameParam = `%${name}%`;
        try {
            result = await db.query(query, [nameParam]) 
            res.render('sql_injection', {results: result.rows, message: ""})
        } catch (e) {
            res.render('sql_injection', {results: [], message: "Dogodila se greška prilikom obrade zahtjeva."});
        }
    }
});
