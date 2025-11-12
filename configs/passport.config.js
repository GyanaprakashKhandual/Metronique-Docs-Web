const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth20');
const GitHubStrategy = require('passport-github2');
const JwtStrategy = require('passport-jwt');
const User = require('../models/user.model.js');
const Workspace = require('../models/workspace.model.js');

const JwtStrategyFromAuthorizationHeaderBearer = JwtStrategy.Strategy;
const ExtractJwt = JwtStrategy.ExtractJwt;

passport.use(
    'local',
    new LocalStrategy.Strategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email: email.toLowerCase() });

                if (!user) {
                    console.log(`Authentication failed: User not found - ${email}`);
                    return done(null, false, {
                        message: 'User not found with this email'
                    });
                }

                if (!user.isEmailVerified) {
                    console.log(`Authentication failed: Email not verified - ${email}`);
                    return done(null, false, {
                        message: 'Please verify your email first'
                    });
                }

                if (user.status === 'suspended') {
                    console.log(`Authentication failed: Account suspended - ${email}`);
                    return done(null, false, {
                        message: 'Your account has been suspended'
                    });
                }

                if (user.status === 'deleted') {
                    console.log(`Authentication failed: Account deleted - ${email}`);
                    return done(null, false, {
                        message: 'Your account has been deleted'
                    });
                }

                const isMatch = await user.comparePassword(password);

                if (!isMatch) {
                    console.log(`Authentication failed: Incorrect password - ${email}`);
                    return done(null, false, {
                        message: 'Password is incorrect'
                    });
                }

                user.lastLoginAt = new Date();
                user.lastLoginIP = '';
                user.isOnline = true;
                await user.save();

                console.log(`User authenticated successfully: ${email}`);
                return done(null, user);
            } catch (error) {
                console.error(`Local authentication error: ${error.message}`);
                return done(error);
            }
        }
    )
);

passport.use(
    'google',
    new GoogleStrategy.Strategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName;
                const avatar = profile.photos?.[0]?.value;
                const googleId = profile.id;

                if (!email) {
                    console.log('Google authentication failed: No email provided');
                    return done(null, false, {
                        message: 'Email not provided by Google'
                    });
                }

                let user = await User.findOne({ email: email.toLowerCase() });

                if (user) {
                    if (!user.oauthConnections) {
                        user.oauthConnections = [];
                    }

                    const googleConnection = user.oauthConnections.find(
                        conn => conn.provider === 'google'
                    );

                    if (!googleConnection) {
                        user.oauthConnections.push({
                            provider: 'google',
                            providerId: googleId,
                            email: email,
                            connectedAt: new Date()
                        });
                    }

                    user.lastLoginAt = new Date();
                    user.isOnline = true;
                    user.isEmailVerified = true;

                    if (avatar && !user.avatar) {
                        user.avatar = avatar;
                    }

                    await user.save();
                    console.log(`Existing user authenticated via Google: ${email}`);
                    return done(null, user);
                }

                const newUser = new User({
                    name: name,
                    email: email.toLowerCase(),
                    avatar: avatar,
                    isEmailVerified: true,
                    status: 'active',
                    role: 'user',
                    oauthConnections: [
                        {
                            provider: 'google',
                            providerId: googleId,
                            email: email,
                            connectedAt: new Date()
                        }
                    ],
                    lastLoginAt: new Date(),
                    isOnline: true
                });

                await newUser.save();

                const personalWorkspace = new Workspace({
                    name: `${name}'s Workspace`,
                    slug: `workspace-${newUser._id.toString().substring(0, 8)}`,
                    description: 'Your personal workspace',
                    owner: newUser._id,
                    type: 'personal',
                    members: [
                        {
                            user: newUser._id,
                            role: 'owner',
                            status: 'active'
                        }
                    ]
                });

                await personalWorkspace.save();

                newUser.workspaces = [
                    {
                        workspace: personalWorkspace._id,
                        role: 'owner',
                        joinedAt: new Date(),
                        isPrimary: true
                    }
                ];
                newUser.primaryWorkspace = personalWorkspace._id;

                await newUser.save();

                console.log(`New user created via Google: ${email}`);
                return done(null, newUser);
            } catch (error) {
                console.error(`Google authentication error: ${error.message}`);
                return done(error);
            }
        }
    )
);

passport.use(
    'github',
    new GitHubStrategy.Strategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName || profile.username;
                const avatar = profile.photos?.[0]?.value;
                const githubId = profile.id;
                const bio = profile._json?.bio;

                if (!email) {
                    console.log('GitHub authentication failed: No email provided');
                    return done(null, false, {
                        message: 'Email not provided by GitHub. Please make your email public on GitHub.'
                    });
                }

                let user = await User.findOne({ email: email.toLowerCase() });

                if (user) {
                    if (!user.oauthConnections) {
                        user.oauthConnections = [];
                    }

                    const githubConnection = user.oauthConnections.find(
                        conn => conn.provider === 'github'
                    );

                    if (!githubConnection) {
                        user.oauthConnections.push({
                            provider: 'github',
                            providerId: githubId,
                            email: email,
                            connectedAt: new Date()
                        });
                    }

                    user.lastLoginAt = new Date();
                    user.isOnline = true;
                    user.isEmailVerified = true;

                    if (avatar && !user.avatar) {
                        user.avatar = avatar;
                    }

                    if (bio && !user.bio) {
                        user.bio = bio;
                    }

                    await user.save();
                    console.log(`Existing user authenticated via GitHub: ${email}`);
                    return done(null, user);
                }

                const newUser = new User({
                    name: name,
                    email: email.toLowerCase(),
                    avatar: avatar,
                    bio: bio,
                    isEmailVerified: true,
                    status: 'active',
                    role: 'user',
                    oauthConnections: [
                        {
                            provider: 'github',
                            providerId: githubId,
                            email: email,
                            connectedAt: new Date()
                        }
                    ],
                    lastLoginAt: new Date(),
                    isOnline: true
                });

                await newUser.save();

                const personalWorkspace = new Workspace({
                    name: `${name}'s Workspace`,
                    slug: `workspace-${newUser._id.toString().substring(0, 8)}`,
                    description: 'Your personal workspace',
                    owner: newUser._id,
                    type: 'personal',
                    members: [
                        {
                            user: newUser._id,
                            role: 'owner',
                            status: 'active'
                        }
                    ]
                });

                await personalWorkspace.save();

                newUser.workspaces = [
                    {
                        workspace: personalWorkspace._id,
                        role: 'owner',
                        joinedAt: new Date(),
                        isPrimary: true
                    }
                ];
                newUser.primaryWorkspace = personalWorkspace._id;

                await newUser.save();

                console.log(`New user created via GitHub: ${email}`);
                return done(null, newUser);
            } catch (error) {
                console.error(`GitHub authentication error: ${error.message}`);
                return done(error);
            }
        }
    )
);

passport.use(
    'jwt',
    new JwtStrategyFromAuthorizationHeaderBearer(
        {
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                ExtractJwt.fromUrlQueryParameter('token'),
                (req) => {
                    if (req.cookies && req.cookies.token) {
                        return req.cookies.token;
                    }
                    return null;
                }
            ]),
            secretOrKey: process.env.JWT_SECRET
        },
        async (jwtPayload, done) => {
            try {
                const user = await User.findById(jwtPayload.id);

                if (!user) {
                    console.log(`JWT authentication failed: User not found - ${jwtPayload.id}`);
                    return done(null, false);
                }

                if (user.status === 'suspended' || user.status === 'deleted') {
                    console.log(`JWT authentication failed: Account ${user.status} - ${user.email}`);
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                console.error(`JWT authentication error: ${error.message}`);
                return done(error);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        console.error(`User deserialization error: ${error.message}`);
        done(error);
    }
});

module.exports = passport;