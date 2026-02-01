const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../models");

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
  passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value;
          await user.save();
          return done(null, user);
        }

        // Create new user with Google info
        // For B2B, we create a basic user that admin needs to approve/complete
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          ownerName: profile.displayName,
          shopName: `${profile.displayName}'s Shop`, // Placeholder - user should update
          phone: "0000000000", // Placeholder - user should update
          avatar: profile.photos[0]?.value,
          role: "USER",
          isVerified: true, // Google email is verified
          isApproved: false, // Admin needs to approve for B2B
          address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
} // End of Google OAuth configuration check

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
