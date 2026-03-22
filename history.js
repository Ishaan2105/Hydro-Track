// history.js

const API_URL = "https://hydro-track.onrender.com";
const token = localStorage.getItem('token'); 

// 1. Identification (Use 'var' to prevent "already declared" errors if home.js is also loaded)
var activeUser = localStorage.getItem('currentUser') || "Guest";
var storageKey = `userData_${activeUser}`;
var notesKey = `userNotes_${activeUser}`; // CRITICAL: Added this so notes work

// 2. Load the actual live data
// We check if 'data' already exists (from home.js); if not, we fetch it.
var data = window.data || JSON.parse(localStorage.getItem(storageKey)) || {
    username: activeUser,
    goal: 2500,
    intake: 0,
    history: {},
    currentLogs: []
};

// let selectedDate = new Date().toISOString().split('T')[0];

// Building YYYY-MM-DD manually to avoid UTC timezone shifts
const today = new Date();
const todayISO = today.getFullYear() + '-' + 
                 String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(today.getDate()).padStart(2, '0');

// Default global selection to today's local date
var selectedDate = todayISO; 

window.addEventListener('DOMContentLoaded', () => {

    /* ============================================================
       2. USER PROFILE SETUP
    ============================================================ */
    const userDisplay = document.getElementById('username-display');
    const avatar = document.getElementById('user-initial');
    
    if (userDisplay) {
        userDisplay.innerText = data.username || activeUser;
    }
    if (avatar) {
        avatar.innerText = (data.username || activeUser).charAt(0).toUpperCase();
    }

    /* ============================================================
       3. DATE PICKER SETUP (Today as Default)
    ============================================================ */
    const picker = document.getElementById('calendar-picker');
    if (picker) {
        picker.value = todayISO;  // Force the input to show today
        picker.max = todayISO;    // Disable selection of future dates
    }

    /* ============================================================
       4. INITIAL DATA LOAD
    ============================================================ */
    // Immediately populate the UI for the current day
    updateOverallStats();
    loadDateStats();     
});

function toggleLogout() {
    const menu = document.getElementById('logout-menu');
    if (menu) {
        // Toggle between 'block' and 'none'
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

function logout() {
    localStorage.removeItem('currentUser'); // Clear session
    window.location.href = 'index.html';    // Redirect to login
}


// Calculate real-time totals by merging history + current intake
function updateOverallStats() {
    // 1. Pull the history map and goals from your cloud-synced data
    const history = data.history || {};
    const todayISO = new Date().toISOString().split('T')[0];
    const dailyGoal = data.goal || 2500; 
    
    // 2. Create a temporary merge of historical data and today's live session
    const fullHistory = { ...history };
    
    // Structure today's entry to match the Map<String, Object> format
    fullHistory[todayISO] = {
        total: Number(data.intake) || 0,
        logs: data.currentLogs || []
    };

    const dates = Object.keys(fullHistory);
    const totalDaysCount = dates.length;
    let goalMetCount = 0;
    let totalVolume = 0;

    // 3. Aggregate totals across the entire history
    dates.forEach(date => {
        const entry = fullHistory[date];
        
        // Handle both object-based entries (new) and legacy number entries
        const dayTotal = (typeof entry === 'object') ? (entry.total || 0) : (Number(entry) || 0);
        
        totalVolume += dayTotal;
        if (dayTotal >= dailyGoal) {
            goalMetCount++;
        }
    });

    const successRate = totalDaysCount > 0 ? Math.round((goalMetCount / totalDaysCount) * 100) : 0;

    /* ============================================================
       4. UI UPDATES (Targeting history.html IDs)
    ============================================================ */
    
    // Total Days Tracked
    const daysEl = document.getElementById('total-days');
    if (daysEl) daysEl.innerText = totalDaysCount;

    // Count of days where goal was achieved
    const goalsEl = document.getElementById('goals-met');
    if (goalsEl) goalsEl.innerText = goalMetCount;

    // Success Percentage calculation
    const successEl = document.getElementById('success-pct');
    if (successEl) successEl.innerText = successRate + "%";

    // Total Liters for the 'Anti-Wrinkle Shield'
    const litersEl = document.getElementById('total-liters');
    if (litersEl) {
        litersEl.innerText = (totalVolume / 1000).toFixed(1) + " L";
    }
}

// Call on load
window.addEventListener('DOMContentLoaded', loadHistoryData);


function loadDateStats() {
    const picker = document.getElementById('calendar-picker');
    if (picker) {
        selectedDate = picker.value; 
    }

    // Keep overall stats updated
    updateOverallStats(); 

    const todayISO = new Date().toISOString().split('T')[0];

    // Update label
    const dateLabel = document.getElementById('current-note-date');
    if (dateLabel) {
        dateLabel.innerText = "Viewing: " + selectedDate;
    }

    let displayVolume = 0;
    let dailyLogs = [];

    /* ============================================================
       1. DATA RETRIEVAL
    ============================================================ */
    if (selectedDate === todayISO) {
        displayVolume = Number(data.intake) || 0;
        dailyLogs = data.currentLogs || [];
    } else {
        const historyEntry = data.history && data.history[selectedDate];

        if (historyEntry) {
            if (typeof historyEntry === "object") {
                displayVolume = historyEntry.total || 0;
                dailyLogs = historyEntry.logs || [];
            } else {
                displayVolume = Number(historyEntry) || 0;
                dailyLogs = [];
            }
        }
    }

    const dailyGoal = data.goal || 2500;
    const dailyPct = Math.round((displayVolume / dailyGoal) * 100);

    /* ============================================================
       2. HYDRATION RANK (Gamification Feature)
    ============================================================ */
    const rankEl = document.getElementById('total-days');
    if (rankEl) {
        let rank = "🌵 Desert Dweller"; // Default for 0-9%

        if (dailyPct >= 90) {
            rank = "🔱 Ocean Master"; // The Ultimate Goal
        } else if (dailyPct >= 80) {
            rank = "🛡️ Shield Guardian"; // Where your Anti-Wrinkle Shield activates
        } else if (dailyPct >= 70) {
            rank = "🏄 Wave Rider";
        } else if (dailyPct >= 60) {
            rank = "🌊 Current Commander"; 
        } else if (dailyPct >= 50) {
            rank = "🚣 River Guide";
        } else if (dailyPct >= 40) {
            rank = "🛶 Stream Sailor";
        } else if (dailyPct >= 30) {
            rank = "💧 Puddle Jumper";
        } else if (dailyPct >= 20) {
            rank = "🧊 Dew Dropper";
        } else if (dailyPct >= 10) {
            rank = "🌫️ Mist Seeker";
        }

        rankEl.innerText = rank;
    }

    /* ============================================================
       3. ANTI-WRINKLE SHIELD (Fun Feature)
    ============================================================ */
    const shieldEl = document.getElementById('total-liters');
    if (shieldEl) {
        if (dailyPct >= 80) {
            shieldEl.innerHTML = `<span style="color: #2e7d32;">ACTIVE ✨</span>`;
        } else {
            shieldEl.innerHTML = `<span style="color: #666;">INACTIVE</span>`;
        }
    }

    /* ============================================================
       4. GOAL MET (YES / NO)
    ============================================================ */
    const goalMetEl = document.getElementById('goals-met');
    if (goalMetEl) {
        if (displayVolume >= dailyGoal) {
            goalMetEl.innerHTML = `✅ <span style="font-size: 0.8rem; color: #2e7d32;"></span>`;
        } else {
            goalMetEl.innerHTML = `❌ <span style="font-size: 0.8rem; color: #d32f2f;"></span>`;
        }
    }

    /* ============================================================
       5. DAILY SUCCESS %
    ============================================================ */
    const successEl = document.getElementById('success-pct');
    if (successEl) {
        successEl.innerText = dailyPct + "%";
    }

    /* ============================================================
       6. UPDATE SUMMARY (ML)
    ============================================================ */
    const consumedEl = document.getElementById('day-consumed');
    if (consumedEl) {
        consumedEl.innerText = displayVolume + " ml";
    }

    /* ============================================================
       7. TIMELINE
    ============================================================ */
    const timelineContainer = document.getElementById('daily-timeline');

    if (timelineContainer) {
        timelineContainer.innerHTML = "";

        if (dailyLogs.length === 0) {
            timelineContainer.innerHTML = `
                <p style="opacity:0.5; padding:20px; text-align:center;">
                    No logs for this day.
                </p>`;
        } else {
            [...dailyLogs].reverse().forEach(log => {
                const item = document.createElement('div');
                item.className = 'timeline-item';

                const val = log.ml || log.amount || 0;

                item.innerHTML = `
                    <span>🕒 ${log.time}</span>
                    <strong>${val} ml</strong>
                `;

                timelineContainer.appendChild(item);
            });
        }
    }

    /* ============================================================
       8. LOAD NOTES
    ============================================================ */
    const savedNotes = JSON.parse(localStorage.getItem(notesKey)) || {};
    const noteArea = document.getElementById('daily-note-area');

    if (noteArea) {
        noteArea.value = savedNotes[selectedDate] || "";
    }
}

async function loadHistoryData() {
    if (!token) return window.location.href = 'index.html';

    try {
        const response = await fetch(`${API_URL}/user/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cloudData = await response.json();
        
        // Populate the global 'data' object with cloud results
        data = cloudData; 
        
        // Trigger UI updates
        updateOverallStats();
        loadDateStats();
    } catch (err) {
        showToast("Failed to fetch history from cloud.");
    }
}

function saveNote() {
    const noteArea = document.getElementById('daily-note-area');
    if (!noteArea) return;

    const noteText = noteArea.value;
    
    // Get the most current notes object from storage
    let allNotes = JSON.parse(localStorage.getItem(notesKey)) || {};

    // Assign text to the currently selected date
    allNotes[selectedDate] = noteText; 

    // Save back to storage
    localStorage.setItem(notesKey, JSON.stringify(allNotes));
    
    showToast("Note saved for " + selectedDate + "!");
}

function deleteNote() {
    if (confirm("Clear notes for " + selectedDate + "?")) {
        let notes = JSON.parse(localStorage.getItem(notesKey)) || {};
        delete notes[selectedDate];
        localStorage.setItem(notesKey, JSON.stringify(notes));
        document.getElementById('daily-note-area').value = "";
    }
}

function updateOverallStats() {
    const history = data.history || {};
    const todayISO = new Date().toISOString().split('T')[0];
    
    // 1. Merge Today's live data with History
    const fullHistory = { ...history };
    
    // We handle Today's data specially to ensure it's always current
    fullHistory[todayISO] = {
        total: Number(data.intake) || 0,
        logs: data.currentLogs || []
    };

    const dates = Object.keys(fullHistory);
    const totalDaysCount = dates.length;
    let goalMetCount = 0;
    let totalVolume = 0;

    // 2. Calculate Totals
    dates.forEach(date => {
        const entry = fullHistory[date];
        const dayTotal = (typeof entry === 'object') ? (entry.total || 0) : (Number(entry) || 0);
        
        totalVolume += dayTotal;
        if (dayTotal >= data.goal) goalMetCount++;
    });

    const successRate = totalDaysCount > 0 ? Math.round((goalMetCount / totalDaysCount) * 100) : 0;

    // 3. Update UI (Using correct IDs from history.html)
    const daysEl = document.getElementById('total-days');
    const goalsEl = document.getElementById('goals-met');
    const successEl = document.getElementById('success-pct');
    const litersEl = document.getElementById('total-liters');

    if (daysEl) daysEl.innerText = totalDaysCount;
    if (goalsEl) goalsEl.innerText = goalMetCount;
    if (successEl) successEl.innerText = successRate + "%";
    if (litersEl) litersEl.innerText = (totalVolume / 1000).toFixed(1) + " L";
}

// Add this logic to your home.js logWater function
function logWater(ml) {
    data.intake += ml;
    
    // Initialize logs if they don't exist
    if(!data.currentLogs) data.currentLogs = [];
    
    // Add the new entry with a timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    data.currentLogs.push({
        time: timeString,
        ml: ml
    });
    
    syncToCloud();
    refreshHome();
}


// EFFECTS
class Noise {
    constructor(seed = 0) {
        this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
        this.p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
        this.perm = new Array(512);
        this.gradP = new Array(512);
        this.seed(seed);
    }
    seed(seed) {
        if (seed > 0 && seed < 1) seed *= 65536;
        seed = Math.floor(seed);
        if (seed < 256) seed |= seed << 8;
        for (let i = 0; i < 256; i++) {
            let v = i & 1 ? this.p[i] ^ (seed & 255) : this.p[i] ^ ((seed >> 8) & 255);
            this.perm[i] = this.perm[i + 256] = v;
            const g = this.grad3[v % 12];
            this.gradP[i] = this.gradP[i + 256] = {x: g[0], y: g[1]};
        }
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return (1 - t) * a + t * b; }
    perlin2(x, y) {
        let X = Math.floor(x), Y = Math.floor(y);
        x -= X; y -= Y; X &= 255; Y &= 255;
        const n00 = this.gradP[X + this.perm[Y]].x * x + this.gradP[X + this.perm[Y]].y * y;
        const n01 = this.gradP[X + this.perm[Y + 1]].x * x + this.gradP[X + this.perm[Y + 1]].y * (y - 1);
        const n10 = this.gradP[X + 1 + this.perm[Y]].x * (x - 1) + this.gradP[X + 1 + this.perm[Y]].y * y;
        const n11 = this.gradP[X + 1 + this.perm[Y + 1]].x * (x - 1) + this.gradP[X + 1 + this.perm[Y + 1]].y * (y - 1);
        const u = this.fade(x);
        return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
    }
}

class WaterWaves {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'waves-canvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
        this.noise = new Noise(Math.random());
        this.lines = [];
        this.mouse = { x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false };
        this.init();
    }

    init() {
    window.addEventListener('resize', () => this.onResize());
    
    // Support both Mouse and Touch
    const handlePointer = (e) => this.onPointerMove(e.touches ? e.touches[0] : e);
    
    window.addEventListener('mousemove', handlePointer);
    window.addEventListener('touchmove', (e) => {
        handlePointer(e);
    }, { passive: true }); // Improved scroll performance on mobile
    
    this.onResize();
    this.tick(0);
    }

    onResize() {
        const b = this.container.getBoundingClientRect();
        this.canvas.width = b.width;
        this.canvas.height = b.height;
        this.setLines(b.width, b.height);
    }

    setLines(width, height) {
        this.lines = [];
        const oWidth = width + 200, oHeight = height + 30;
        const totalLines = Math.ceil(oWidth / this.config.xGap);
        const totalPoints = Math.ceil(oHeight / this.config.yGap);
        const xStart = (width - this.config.xGap * totalLines) / 2;
        const yStart = (height - this.config.yGap * totalPoints) / 2;

        for (let i = 0; i <= totalLines; i++) {
            const pts = [];
            for (let j = 0; j <= totalPoints; j++) {
                pts.push({ x: xStart + this.config.xGap * i, y: yStart + this.config.yGap * j, wave: { x: 0, y: 0 }, cursor: { x: 0, y: 0, vx: 0, vy: 0 } });
            }
            this.lines.push(pts);
        }
    }

    onPointerMove(e) {
    const b = this.container.getBoundingClientRect();
    this.mouse.x = e.clientX - b.left;
    this.mouse.y = e.clientY - b.top;
    if (!this.mouse.set) {
        this.mouse.sx = this.mouse.lx = this.mouse.x;
        this.mouse.sy = this.mouse.ly = this.mouse.y;
        this.mouse.set = true;
    }
    }

    tick(t) {
        this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.1;
        this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.1;
        const dx = this.mouse.x - this.mouse.lx, dy = this.mouse.y - this.mouse.ly;
        const d = Math.hypot(dx, dy);
        this.mouse.vs += (d - this.mouse.vs) * 0.1;
        this.mouse.vs = Math.min(100, this.mouse.vs);
        this.mouse.lx = this.mouse.x; this.mouse.ly = this.mouse.y;
        this.mouse.a = Math.atan2(dy, dx);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.config.lineColor;

        this.lines.forEach(pts => {
            pts.forEach(p => {
                const move = this.noise.perlin2((p.x + t * this.config.waveSpeedX) * 0.002, (p.y + t * this.config.waveSpeedY) * 0.0015) * 12;
                p.wave.x = Math.cos(move) * this.config.waveAmpX;
                p.wave.y = Math.sin(move) * this.config.waveAmpY;

                const mdx = p.x - this.mouse.sx, mdy = p.y - this.mouse.sy;
                const dist = Math.hypot(mdx, mdy), l = Math.max(175, this.mouse.vs);
                if (dist < l) {
                    const f = Math.cos(dist * 0.001) * (1 - dist / l);
                    p.cursor.vx += Math.cos(this.mouse.a) * f * l * this.mouse.vs * 0.00065;
                    p.cursor.vy += Math.sin(this.mouse.a) * f * l * this.mouse.vs * 0.00065;
                }
                p.cursor.vx += (0 - p.cursor.x) * this.config.tension;
                p.cursor.vy += (0 - p.cursor.y) * this.config.tension;
                p.cursor.vx *= this.config.friction; p.cursor.vy *= this.config.friction;
                p.cursor.x += p.cursor.vx * 2; p.cursor.y += p.cursor.vy * 2;
            });

            this.ctx.moveTo(pts[0].x + pts[0].wave.x, pts[0].y + pts[0].wave.y);
            pts.forEach((p, idx) => {
                const isLast = idx === pts.length - 1;
                this.ctx.lineTo(p.x + p.wave.x + (isLast ? 0 : p.cursor.x), p.y + p.wave.y + (isLast ? 0 : p.cursor.y));
            });
        });
        this.ctx.stroke();
        requestAnimationFrame((time) => this.tick(time));
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg'; // Styling already added in previous step
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Initialize with your settings
new WaterWaves('waves-bg', {
    lineColor: "#ffffff",
    waveSpeedX: 0.0125,
    waveSpeedY: 0.01,
    waveAmpX: 40,
    waveAmpY: 20,
    friction: 0.9,
    tension: 0.01,
    xGap: 12,
    yGap: 36
});
