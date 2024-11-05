import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import { prisma } from "../singeltons/singeltons.js";
import dotenv from "dotenv";
dotenv.config();
passport.serializeUser((user, done) => {
    done(null, { id: user.id, email: user.email, name: user.name, iamge: user.image });
});
passport.deserializeUser(async (user, done) => {
    try {
        const findUser = await prisma.user.findFirst({
            where: {
                id: user.id
            }
        });
        if (findUser) {
            done(null, findUser);
        }
        else {
            done(null, false);
        }
    }
    catch (err) {
        done(new Error("somthing went wrong"), false);
    }
});
passport.use(new Strategy({
    clientID: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    callbackURL: process.env.AUTH_GOOGLE_CALLBACK,
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await prisma.$transaction(async (ts) => {
            const account = await ts.account.findFirst({
                where: { providerAccountId: profile.id, provider: "GOOGLE" },
            });
            if (!account) {
                const newUser = await ts.user.create({
                    data: {
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        image: profile.photos[0].value
                    },
                    select: { id: true, name: true, email: true, image: true },
                });
                await ts.account.create({
                    data: {
                        provider: "GOOGLE",
                        providerAccountId: profile.id,
                        userId: newUser.id,
                    },
                });
                return newUser;
            }
            else {
                return ts.user.update({
                    data: {
                        name: profile.displayName,
                        image: profile.photos[0].value
                    },
                    where: { id: account.userId },
                    select: { id: true, name: true, email: true, image: true },
                });
            }
        });
        return done(null, user);
    }
    catch (error) {
        return done(null, false, { msg: "somthing went wrong" });
    }
}));
export { passport };
//# sourceMappingURL=auth.js.map