require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

app.use(cors({
    origin: "https://hydro-track.onrender.com", // This MUST match your frontend URL exactly
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// This line is CRITICAL. It answers the "preflight" check the browser is complaining about.
app.options('*', cors());

// --- 1. MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to HydroTrack Cloud DB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 2. USER SCHEMA & MODEL ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    goal: { type: Number, default: 2500 },
    reminders: { type: Array, default: [] }, // Stores times like ["08:00", "12:00", "18:00"]
    intake: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastLogDate: String,
    history: { type: Map, of: Object }, // Stores YYYY-MM-DD: { total, logs }
    currentLogs: Array,
    mealTimes: {
        bfast: String,
        lunch: String,
        dinner: String
    },
    badges: { type: Array, default: [] } // Stores strings like '5-day-streak', 'hydration-pro'
});

const User = mongoose.model('User', UserSchema);

// --- 3. AUTHENTICATION ROUTES ---

// Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ 
            username, 
            email, 
            password: hashedPassword,
            lastLogDate: new Date().toISOString().split('T')[0]
        });

        await newUser.save();
        res.status(201).json({ message: "User created!" });
    } catch (err) {
        res.status(400).json({ error: "Username or Email already exists." });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
});

// --- 4. HYDRATION DATA ROUTES ---

// Sync/Save User Data (Replaces your saveData() function)
app.post('/api/user/sync', async (req, res) => {
    const { token, userData } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Use $set to only update the specific fields provided
        // This protects against accidentally deleting fields not sent in the request
        await User.findByIdAndUpdate(decoded.id, { $set: userData }); 
        
        res.json({ message: "Cloud Sync Successful!" });
    } catch (err) {
        res.status(401).json({ error: "Unauthorized Session" });
    }
});

app.post('/api/auth/update-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
        res.json({ message: "Password updated!" });
    } catch (err) {
        res.status(401).json({ error: "Unauthorized" });
    }
});

// Fetch User Data (For initial load)
app.get('/api/user/data', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await User.findById(decoded.id).select('-password');
        
        const todayISO = new Date().toISOString().split('T')[0];

        // --- SERVER-SIDE DAILY RESET LOGIC ---
        if (user.lastLogDate !== todayISO) {
            // 1. Archive previous day's data into the History Map
            const historyEntry = {
                total: user.intake || 0,
                logs: user.currentLogs || []
            };

            // 2. Perform the update in MongoDB
            user = await User.findByIdAndUpdate(decoded.id, {
                $set: { 
                    [`history.${user.lastLogDate}`]: historyEntry,
                    intake: 0,
                    currentLogs: [],
                    lastLogDate: todayISO
                }
            }, { new: true }).select('-password');
        }

        res.json(user);
    } catch (err) {
        res.status(401).json({ error: "Unauthorized" });
    }
});

const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
    const oauth2Client = new OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) reject("Failed to create access token");
            resolve(token);
        });
    });

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL_USER,
            accessToken,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
    });
};

// Forgot Password Route
app.post('/api/auth/recover', async (req, res) => {
    const { email } = req.body;
    try {
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "No account found with this email." });
        }

        // 2. Generate and Hash Temporary Password
        const tempPass = "TEMP-" + Math.floor(1000 + Math.random() * 9000);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPass, salt);

        // 3. Update Database (Wait for this to finish before emailing!)
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        // 4. Send the Email
        const transporter = await createTransporter();
        const mailOptions = {
            from: `HydroTrack <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Temporary Password | HydroTrack",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e3f2fd; border-radius: 10px;">
                    <h2 style="color: #1565c0;">💧 HydroTrack Recovery</h2>
                    <p>You requested a password reset. Use the temporary password below to log in:</p>
                    <div style="background: #f0f4f8; padding: 15px; font-size: 1.2rem; font-weight: bold; text-align: center; border-radius: 5px; color: #333;">
                        ${tempPass}
                    </div>
                    <p style="color: #666; font-size: 0.9rem; margin-top: 15px;">
                        Important: Please change your password immediately after logging in from the Settings page.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Recovery email sent successfully!" });

    } catch (error) {
        console.error("Recovery Error:", error);
        res.status(500).json({ error: "Failed to send recovery email. Is the server configured?" });
    }
});





const path = require('path');

// 1. Serve static files (Assuming your HTML files are in the root or a 'public' folder)
app.use(express.static(__dirname)); 

// 2. Route all non-API requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 HydroTrack Server live on port ${PORT}`));
