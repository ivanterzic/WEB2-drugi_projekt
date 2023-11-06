import express from 'express';
import {db} from '../db/index.js';
import dotenv from 'dotenv';
import session from 'express-session';
import csrf from 'csurf';

dotenv.config();

export const safeCsrfRoutes = express.Router();

const balaceDefaults = {
    "ĐuroSafe" : 100000,
    "LopužaSafe" : 0,
    "PeroSafe" : 150
}

dotenv.config();
const urlBase =  process.env.BASE_URL || process.env.DEV_URL || "http://localhost:5000";

const csrfProtec = csrf();

safeCsrfRoutes.use(express.urlencoded({ extended: true }));
safeCsrfRoutes.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized : true,
    cookie: { secure: false, httpOnly: false }
}))

safeCsrfRoutes.use(function(req, res, next) {
    res.locals.username = req.session.username;
    res.locals.safe = true;
    next();
});

function checkLoggedIn(req, res, next) {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/safecsrf/login');
    }
}

function checkCredentials(req, res, next) {
    if (req.body.username && req.body.password) {
        if (req.body.username === "PeroSafe" && req.body.password === "12345" || req.body.username === "LopužaSafe" && req.body.password === "12345" || req.body.username === "ĐuroSafe" && req.body.password === "12345") {
            req.session.loggedin = true;
            req.session.username = req.body.username;
            req.session.regenerate(function(err) {
                if(err){
                    res.send(err);
                }
            });
            next();
        }
        else {
            res.render('safecsrflogin', {message: "Neispravni podaci!", baseURL: urlBase});
        }
    }
    else {
        res.render('safecsrflogin', {message: "Neispravni podaci!", baseURL: urlBase});
    }
}

safeCsrfRoutes.get("/", async (req, res) => {
    let results, resultss
    try {
        results = await db.query("SELECT name, account_balance FROM safecsrftable", [])
        resultss = await db.query("SELECT name, account_balance FROM safecsrftable", [])
    }
    catch (e) {
        res.send(e);
    }
    res.render('csrf', {results: results.rows, resultss: resultss.rows, baseURL: urlBase});
});

safeCsrfRoutes.get("/login", (req, res) => {
    res.render('safecsrflogin', {message: "", baseURL: urlBase});
});

safeCsrfRoutes.post("/login", checkCredentials, async (req, res) => {
    res.redirect('/safecsrf/account');
});

safeCsrfRoutes.get("/logout", checkLoggedIn, async (req, res) => {
    req.session.destroy(function(err) {
        if(err){
            res.send(err);
        }
    });
    res.redirect('/safecsrf');
});

safeCsrfRoutes.get("/account", checkLoggedIn, csrfProtec, async (req, res) => {    
    let result
    try {
        result = await db.query("SELECT name, account_balance FROM safecsrftable WHERE name = $1", [req.session.username])
        res.render('safeaccount', {results: result.rows[0], baseURL: urlBase, message : "", csrfToken: req.csrfToken()});
    }
    catch (e) {
        res.send(e);
        //res.render('csrf', {results: []});
    }
});

safeCsrfRoutes.post("/transferfunds", checkLoggedIn, csrfProtec, async (req, res) => {
    const from = req.session.username;
    const to = req.body.acc
    const amount = req.body.amount
    let resultInitial
    try {
        resultInitial = await db.query("SELECT name, account_balance FROM safecsrftable WHERE name = $1", [req.session.username])
    }
    catch (e) {
        res.send(e);
    }
    if (!from || !to || !amount) {
        res.render('safeaccount', {results: resultInitial.rows[0] , baseURL: urlBase, message : "Nepostojeći računi!", csrfToken: req.csrfToken()});
        return;
    }
    try {
        const fromAccountResult = await db.query(
            "SELECT account_balance FROM safecsrftable WHERE name = $1",
            [from]
        );
        const toAccountResult = await db.query(
            "SELECT account_balance FROM safecsrftable WHERE name = $1",
            [to]
        );
        if (fromAccountResult.rows.length !== 1 || toAccountResult.rows.length !== 1) {
            res.render('safeaccount', {results: resultInitial.rows[0] , baseURL: urlBase, message : "Nepostojeći računi!", csrfToken: req.csrfToken()});
            return;
        }
        const fromAccount = fromAccountResult.rows[0];
        const toAccount = toAccountResult.rows[0];
        if (fromAccount.account_balance < amount) {
            res.render('safeaccount', {results: resultInitial.rows[0] , baseURL: urlBase, message : "Nemate dovoljno sredstava!", csrfToken: req.csrfToken()});
            return;
        }
        await db.query(
            "UPDATE safecsrftable SET account_balance = account_balance - $1 WHERE name = $2",
            [amount, from]
        );
        await db.query(
            "UPDATE safecsrftable SET account_balance = account_balance + $1 WHERE name = $2",
            [amount, to]
        );
        res.redirect("/safecsrf/account");
    } catch (e) {
        res.render('safeaccount', {results: resultInitial.rows[0] , baseURL: urlBase, message : "Nepostojeći računi!", csrfToken: req.csrfToken()});
    }
});

safeCsrfRoutes.get("/lopuzinlink", (req, res) => {
   res.render('safelopuza', {baseURL: urlBase});
});

safeCsrfRoutes.post("/resetfunds", async (req, res) => {
    let result
    try {
        for (const [key, value] of Object.entries(balaceDefaults)) {
            result = await db.query("UPDATE safecsrftable SET account_balance = $1 WHERE name = $2", [value, key])
        }
    }
    catch (e) {
        res.send(e);
    }
    res.redirect('/csrf');
});
