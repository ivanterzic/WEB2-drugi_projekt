import express from 'express';
import {db} from '../db/index.js';
import dotenv from 'dotenv';
import session from 'express-session';
import csrf from 'csurf';

dotenv.config();

export const csrfRoutes = express.Router();

dotenv.config();
const urlBase = process.env.DEV_URL || process.env.BASE_URL || "http://localhost:5000";

const csrfZastita = csrf();
csrfRoutes.use(express.urlencoded({ extended: true }));
csrfRoutes.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized : true,
    cookie: { secure: false, httpOnly: false }
}))

csrfRoutes.get("/", async (req, res) => {
    let results
    try {
        results = await db.query("SELECT name, account_balance FROM csrfexample", [])
    }
    catch (e) {
        res.send(e);
    }
    res.render('csrf', {results: results.rows, baseURL: urlBase + req.baseUrl});
}
);

csrfRoutes.get("/login", (req, res) => {
    res.render('csrflogin', {message: "", baseURL: urlBase + req.baseUrl});
});

csrfRoutes.post("/login", async (req, res) => {
    if (req.body.username && req.body.password) {
        if (req.body.username === "Pero" && req.body.password === "12345" || req.body.username === "Lopuža" && req.body.password === "12345" || req.body.username === "Đuro" && req.body.password === "12345") {
            req.session.loggedin = true;
            req.session.username = req.body.username;
            req.session.regenerate(function(err) {
                if(err){
                    res.send(err);
                }
            }
            );
            res.redirect('/csrf/account');
        }
        else {
            res.render('csrflogin', {message: "Neispravni podaci!", baseURL: urlBase + req.baseUrl});
        }
}
    else {
        res.render('csrflogin', {message: "Neispravni podaci!", baseURL: urlBase + req.baseUrl});
    }
}
);

csrfRoutes.get("/logout", async (req, res) => {
    req.session.destroy(function(err) {
        if(err){
            res.send(err);
        }
    });
    res.redirect('/csrf');
}
);

csrfRoutes.get("/account", async (req, res) => {    
    if (req.session.loggedin) {
        let result
        try {
            result = await db.query("SELECT name, account_balance FROM csrfexample", [])
            res.render('account', {results: result.rows[0], baseURL: urlBase + req.baseUrl});
        }
        catch (e) {
            res.send(e);
            //res.render('csrf', {results: []});
        }
    } else {
        res.redirect('/csrf/login');
    }
}
);


 
csrfRoutes.get("/transferfunds", async (req, res) => {
    if (req.session.loggedin) {
        const from = req.session.username;
        const to = req.query.acc
        const amount = req.query.amount
        if (!from || !to || !amount) {
            res.status(400).send("Nedostaju parametri!");
            return;
        }
        try {
            const result = await db.query(
                "SELECT account_balance FROM csrfexample WHERE name = $1 OR name = $2",
                [from, to]
            );
            if (result.rows.length !== 2) {
                res.status(400).send("Nepostojeći računi!");
                return;
            }
            const [fromAccount, toAccount] = result.rows;
            if (fromAccount.account_balance < amount) {
                res.status(400).send("nedovoljno sredstava!");
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
            res.status(500).send(e);
        }
    } else {
        res.redirect("/csrf/login");
    }
}
);

csrfRoutes.get("lopuzinlink", async (req, res) => {
   res.render('lopuza', {baseURL: urlBase + req.baseUrl});
}
);
