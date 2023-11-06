import express from 'express';
import {db} from '../db/index.js';
import dotenv from 'dotenv';
import session from 'express-session';
import csrf from 'csurf';

dotenv.config();

export const csrfRoutes = express.Router();

const balaceDefaults = {
    "Đuro" : 100000,
    "Lopuža" : 0,
    "Pero" : 150
}

dotenv.config();
const urlBase =  process.env.BASE_URL || process.env.DEV_URL || "http://localhost:5000";

const csrfZastita = csrf();
csrfRoutes.use(express.urlencoded({ extended: true }));
csrfRoutes.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized : true,
    cookie: { secure: false, httpOnly: false }
}))
csrfRoutes.use(function(req, res, next) {
    res.locals.username = req.session.username;
    res.locals.safe = false;
    next();
});

function checkLoggedIn(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/csrf/login');
    }
}

function checkCredentials(req, res, next) {
    if (req.body.username && req.body.password) {
        if (req.body.username === "Pero" && req.body.password === "12345" || req.body.username === "Lopuža" && req.body.password === "12345" || req.body.username === "Đuro" && req.body.password === "12345") {
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
            res.render('csrflogin', {message: "Neispravni podaci!", baseURL: urlBase });
        }
    }
    else {
        res.render('csrflogin', {message: "Neispravni podaci!", baseURL: urlBase });
    }
}

csrfRoutes.get("/", async (req, res) => {
    let results, resultss
    try {
        results = await db.query("SELECT name, account_balance FROM csrfexample", [])
        resultss = await db.query("SELECT name, account_balance FROM safecsrftable", [])
    }
    catch (e) {
        res.send(e);
    }
    res.render('csrf', {results: results.rows, resultss: resultss.rows, baseURL: urlBase });
});

csrfRoutes.get("/login", (req, res) => {
    res.render('csrflogin', {message: "", baseURL: urlBase });
});

csrfRoutes.post("/login", checkCredentials, async (req, res) => {
    res.redirect('/csrf/account');
});

csrfRoutes.get("/logout", async (req, res) => {
    req.session.destroy(function(err) {
        if(err){
            res.send(err);
        }
    });
    res.redirect('/csrf');
});

csrfRoutes.get("/account", checkLoggedIn, async (req, res) => {    
    let result
    try {
        result = await db.query("SELECT name, account_balance FROM csrfexample WHERE name = $1", [req.session.username])
        res.render('account', {results: result.rows[0], baseURL: urlBase , message : ""});
    }
    catch (e) {
        res.send(e);
        //res.render('csrf', {results: []});
    }
});

csrfRoutes.get("/transferfunds", checkLoggedIn, async (req, res) => {
    const from = req.session.username;
    const to = req.query.acc
    const amount = req.query.amount
    let resultInitial
    try {
        resultInitial = await db.query("SELECT name, account_balance FROM csrfexample WHERE name = $1", [req.session.username])
    }
    catch (e) {
        res.send(e);
    }
    if (!from || !to || !amount) {
        res.render('account', {results: resultInitial.rows[0] , baseURL: urlBase , message : "Nepostojeći računi!"});
        return;
    }
    try {
        const fromAccountResult = await db.query(
            "SELECT account_balance FROM csrfexample WHERE name = $1",
            [from]
        );
        const toAccountResult = await db.query(
            "SELECT account_balance FROM csrfexample WHERE name = $1",
            [to]
        );
        if (fromAccountResult.rows.length !== 1 || toAccountResult.rows.length !== 1) {
            res.render('account', {results: resultInitial.rows[0] , baseURL: urlBase , message : "Nepostojeći računi!"});
            return;
        }
        const fromAccount = fromAccountResult.rows[0];
        const toAccount = toAccountResult.rows[0];
        if (fromAccount.account_balance < amount) {
            res.render('account', {results: resultInitial.rows[0] , baseURL: urlBase , message : "Nemate dovoljno sredstava!"});
            return;
        }
        await db.query(
            "UPDATE csrfexample SET account_balance = account_balance - $1 WHERE name = $2",
            [amount, from]
        );
        await db.query(
            "UPDATE csrfexample SET account_balance = account_balance + $1 WHERE name = $2",
            [amount, to]
        );
        res.redirect("/csrf/account");
    } catch (e) {
        res.render('account', {results: resultInitial.rows[0] , baseURL: urlBase , message : "Nepostojeći računi!"});
    }
});

csrfRoutes.get("/lopuzinlink", (req, res) => {
   res.render('lopuza', {baseURL: urlBase });
});

csrfRoutes.post("/resetfunds" , async (req, res) => {
    let result
    try {
        for (const [key, value] of Object.entries(balaceDefaults)) {
            result = await db.query("UPDATE csrfexample SET account_balance = $1 WHERE name = $2", [value, key])
        }
    }
    catch (e) {
        res.send(e);
    }
    res.redirect('/csrf');
});
