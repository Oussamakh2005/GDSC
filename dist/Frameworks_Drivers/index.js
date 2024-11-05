import express from "express";
import { passport } from "./auth/auth.js";
import session from "express-session";
import dotenv from "dotenv";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import cors from "cors";
import csurf from "csurf";
dotenv.config();
const app = express();
const pgSession = connectPgSimple(session);
const csrfProtection = csurf({ cookie: true });
app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
}));
app.use(cookieParser());
app.use(session({
    name: "session_id",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new pgSession({
        conString: process.env.DATABASE_URL,
        tableName: "session",
    }),
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: "lax",
        domain: process.env.CLIENT_DOMAIN
    },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);
app.get("/api/oauth/google/", passport.authenticate("google"));
app.get("/api/oauth/google/callback/", passport.authenticate("google"), (req, res) => {
    res.cookie('session_id', req.sessionID, {
        httpOnly: true,
        path: "/",
        domain: process.env.CLIENT_DOMAIN,
        secure: process.env.NODE_ENV == "production",
        sameSite: "lax",
        maxAge: 3600000,
    }).redirect(process.env.CLIENT_ORIGIN + "/page.html");
});
app.get("/api/test", (req, res) => {
    const { user } = req;
    res.status(200).json({
        name: user.name,
        email: user.email,
        image: user.image
    });
});
app.listen(5000, () => {
    console.log("app is running on port 5000");
});
//# sourceMappingURL=index.js.map