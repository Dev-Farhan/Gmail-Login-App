// Import required modules
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import User from "./model/userModel.js";
import GoogleStrategy from "passport-google-oauth20";
import { fileURLToPath } from "url";
import { dirname, join } from "path"; // Import the 'join' function from the 'path' module

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);

// Create an Express app
const app = express();
dotenv.config();

app.get("/", (req, res) => {
  // Use `join` to create an absolute path to the "index.html" file
  const indexPath = join(__dirname, "client", "index.html");
  res.sendFile(indexPath);
});

// Serve static files from the "client" directory
app.use(express.static(join(__dirname, "client"))); // Use 'join' to specify the correct path

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/farhan", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Set up session middleware
app.use(
  session({
    secret: "kaalastar",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Google OAuth 2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in MongoDB
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          // User already exists, update their data if needed
          // For example, you may want to update the user's access token here
          return done(null, existingUser);
        }

        // User doesn't exist, create a new user document in MongoDB
        const newUser = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          // Add other relevant user data here
        });
        console.log(newUser);
        // Save the new user document
        await newUser.save();

        // Call done to indicate successful authentication
        done(null, newUser);
      } catch (error) {
        // Handle errors
        done(error);
      }
    }
  )
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Set up routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/profile",
    failureRedirect: "/",
  })
);

app.get("/profile", (req, res) => {
  res.send("Welcome to your profile!");
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
