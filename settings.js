// Dataset: 100 Unique Reminders
const hydrationTexts = [

"💧 Time for a splash! Drink some water.",
"Your brain is 75% water. Feed it!",
"Stay hydrated, stay legendary.",
"Glow from the inside out. Sip now!",
"One glass now = More energy later.",
"Feeling tired? Water is the cure.",
"H2O is the way to go!",
"Sip, sip, hooray!",
"Don't wait for thirst, hydrate first.",
"Water: The original energy drink.",

"Refill your energy with water.",
"A sip a day keeps fatigue away.",
"Hydrate your greatness.",
"Clear mind starts with clear water.",
"Drink now, thank yourself later.",
"Hydration = Power.",
"Stay fresh, drink water.",
"Water fuels your hustle.",
"Hydrate like a champion.",
"Take a break, take a sip.",

"Small sips, big benefits.",
"Water today, wellness tomorrow.",
"Be cool, drink water.",
"Keep calm and hydrate.",
"Hydrate your hustle.",
"Drink up, level up.",
"Water makes everything better.",
"Hydrate and dominate.",
"Fuel your focus with water.",
"Drink water, stay unstoppable.",

"Your body will thank you.",
"Hydration is self-care.",
"Hydrate to feel great.",
"Drink water, boost power.",
"A hydrated body is a happy body.",
"Every sip counts.",
"Refuel with water.",
"Stay hydrated, stay sharp.",
"Water keeps you winning.",
"Sip smart, live well.",

"Water is life.",
"Drink water, stay awesome.",
"Hydrate for success.",
"Be a hydration hero.",
"Keep the water flowing.",
"Stay hydrated, stay focused.",
"Water boosts your mood.",
"Hydration is motivation.",
"Drink water, feel better.",
"Keep sipping greatness.",

"Hydration unlocks energy.",
"Refresh your body.",
"Hydrate to elevate.",
"Your body needs water now.",
"Sip your way to health.",
"Stay cool with water.",
"Hydration keeps you going.",
"Drink water, power up.",
"Stay hydrated, shine bright.",
"Hydrate for clarity.",

"Water keeps you balanced.",
"Sip some happiness.",
"Hydrate for strength.",
"Drink water, feel alive.",
"Stay hydrated, stay happy.",
"Water fuels your day.",
"Drink to think better.",
"Hydrate your potential.",
"Stay hydrated, stay winning.",
"Refresh your mind.",

"Drink water, conquer the day.",
"Hydrate for productivity.",
"Water keeps you energized.",
"Hydration builds stamina.",
"Drink water, stay vibrant.",
"Hydrate your ambition.",
"Stay refreshed with water.",
"Hydrate to dominate.",
"Drink water for clarity.",
"Water powers performance.",

"Hydrate your body and mind.",
"Drink water for strength.",
"Hydrate and shine.",
"Water keeps your brain sharp.",
"Stay refreshed, stay hydrated.",
"Drink water and thrive.",
"Hydrate for endurance.",
"Water is pure energy.",
"Stay hydrated, stay unstoppable.",
"Drink water and glow.",

"Hydration is your superpower.",
"Drink water, feel unstoppable.",
"Hydrate for greatness.",
"Stay hydrated, stay powerful.",
"Drink water and succeed.",
"Hydration is victory fuel.",
"Water strengthens your focus.",
"Drink water, achieve more.",
"Hydrate your dreams.",
"Stay hydrated, stay legendary.",

"Drink water for peak performance.",
"Hydrate to recharge.",
"Water refreshes everything.",
"Stay hydrated, stay fearless.",
"Drink water and conquer.",
"Hydrate your confidence.",
"Water keeps you sharp.",
"Drink water and power through.",
"Hydrate your inner champion.",
"Stay hydrated and unstoppable.",

"Water boosts your brilliance.",
"Drink water for a fresh start.",
"Hydrate and feel amazing.",
"Water fuels creativity.",
"Stay hydrated and thrive.",
"Drink water and keep moving.",
"Hydrate your success.",
"Water keeps the momentum.",
"Stay hydrated and energized.",
"Drink water and stay strong."

];

function getRandomReminder() {
    return hydrationTexts[Math.floor(Math.random() * hydrationTexts.length)];
}


function setNotifMode(mode) {
    const btnSpecific = document.getElementById('btn-specific');
    const btnInterval = document.getElementById('btn-interval');
    const specOptions = document.getElementById('specific-options');
    const intOptions = document.getElementById('interval-options');

    // Only update if the elements exist in the HTML
    if (btnSpecific) btnSpecific.className = mode === 'specific' ? 'active' : '';
    if (btnInterval) btnInterval.className = mode === 'interval' ? 'active' : '';
    
    if (specOptions) specOptions.style.display = mode === 'specific' ? 'block' : 'none';
    if (intOptions) intOptions.style.display = mode === 'interval' ? 'block' : 'none';
}

async function saveGlobalGoal() {
    const goalInput = document.getElementById('goal-val');
    if (!goalInput) return;

    const newGoalLiters = parseFloat(goalInput.value);

    // 1. Validation
    if (newGoalLiters > 0) {
        // Update the global data object (Cloud state)
        // Convert Liters to milliliters for the MERN schema
        data.goal = newGoalLiters * 1000; 
        
        // 2. Sync to MongoDB using the central function
        // This avoids hardcoding URLs and redundant fetch blocks
        await syncToCloud(); 

        showToast(`🎯 Target updated to ${newGoalLiters}L!`);
        
        // 3. Optional: Redirect after cloud confirmation
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1200);
    } else {
        showToast("❌ Please enter a valid number (e.g., 2.5)");
    }
}



function updatePassword() {
    const newP = document.getElementById('new-pass').value;
    const confP = document.getElementById('conf-pass').value;
    if (newP === confP && newP !== "") {
        showNotification("Password updated successfully!");
        clearPassFields();
    } else {
        showNotification("Passwords do not match.");
    }
}

function clearPassFields() {
    document.getElementById('curr-pass').value = "";
    document.getElementById('new-pass').value = "";
    document.getElementById('conf-pass').value = "";
}

function loadReminders() {
    const list = document.getElementById('reminders-list');
    if (!list || !data || !data.reminders) return;

    list.innerHTML = "";

    // FIX: Filter by 'active' (the checkbox) rather than 'daily' (the toggle)
    const activeReminders = data.reminders.filter(rem => rem.active === true);

    if (activeReminders.length === 0) {
        list.innerHTML = `<p style="text-align:center; opacity:0.5; padding:20px;">No active reminders.</p>`;
        return;
    }

    activeReminders.forEach(rem => {
        const reminderDiv = document.createElement('div');
        reminderDiv.className = 'reminder-item';
        
        // Show whether it is a Daily or One-Time (Once) alarm
        const typeLabel = rem.daily ? '🔁 DAILY' : '⏱️ ONCE';

        reminderDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="time-tag">🔔 ${rem.time}</span> 
                <span style="font-size:0.7rem; color:#1565c0; font-weight:bold; background:#f0f4f8; padding:2px 8px; border-radius:5px;">
                    ${typeLabel} • ACTIVE
                </span>
            </div>
            <span class="msg-tag">"${getRandomReminder()}"</span>
        `;
        list.appendChild(reminderDiv);
    });
}

// Helper to uncheck a box and refresh
function removeReminder(time) {
    const box = document.querySelector(`.dummy-times input[value="${time}"]`);
    if (box) box.checked = false;
    loadReminders();
}

async function toggleIntervalFeature() {
    const isEnabled = document.getElementById('interval-master-toggle').checked;
    const inputArea = document.getElementById('interval-input-area');
    
    if (isEnabled) {
        // Corrected camelCase for JavaScript styles
        inputArea.style.opacity = "1";
        inputArea.style.pointerEvents = "auto"; 
        showToast("Interval reminders active! 💧");
    } else {
        inputArea.style.opacity = "0.5";
        inputArea.style.pointerEvents = "none";
        showToast("Interval reminders disabled.");
    }

    // Save the toggle state to our global data object and sync to MongoDB 
    data.intervalEnabled = isEnabled;
    await syncToCloud();
}


async function addManualTime() {
    const timeInput = document.getElementById('manual-t');
    const timeValue = timeInput.value;

    if (!timeValue) return showToast("❌ Select a time.");

    // Create the new reminder object
    const newReminder = {
        time: timeValue,
        daily: true, 
        active: true
    };

    // Push to existing array instead of overwriting
    if (!data.reminders) data.reminders = [];
    data.reminders.push(newReminder);

    // Sort times so they appear in chronological order
    data.reminders.sort((a, b) => a.time.localeCompare(b.time));

    await syncToCloud(); // Save to MongoDB
    renderCloudReminders(); // Re-render the list
    timeInput.value = "";
    showToast(`✅ Added ${timeValue}`);
}

async function deleteReminder(index) {
    // Remove the item from the local data array immediately
    const deletedTime = data.reminders[index].time;
    data.reminders.splice(index, 1); 

    // Sync the change to MongoDB
    await syncToCloud(); 

    // Re-render the UI so the row disappears
    renderCloudReminders(); 

    // Use your existing toast for non-intrusive feedback
    showToast(`🗑️ Deleted reminder for ${deletedTime}`);
}

async function updateReminderStatus(index, isChecked) {
    data.reminders[index].active = isChecked;
    await syncToCloud();
    loadReminders();
}

async function updateReminderType(index, isDaily) {
    data.reminders[index].daily = isDaily;
    await syncToCloud();
    loadReminders();
}

// Function to validate and toggle Post-Meal reminders
async function togglePostMeal() {
    const toggle = document.getElementById('post-meal-toggle');
    
    // Safety check for meal times
    const meals = data.mealTimes || {};
    const isComplete = meals.bfast && meals.lunch && meals.dinner;

    if (toggle.checked && !isComplete) {
        toggle.checked = false;
        showToast("⚠️ Please set Meal times in Insights first!");
        return;
    }

    // ✅ CRITICAL: Update the data object so syncToCloud sends the right value
    data.postMealEnabled = toggle.checked; 
    await syncToCloud();
    
    showToast(data.postMealEnabled ? "🥗 Reminders Active!" : "Notifications Disabled");
}

function renderCloudReminders() {
    const container = document.querySelector('.dummy-times');
    if (!container || !data.reminders) return;

    container.innerHTML = ""; 

    data.reminders.forEach((rem, index) => {
        const row = document.createElement('div');
        row.className = 'time-toggle-row';
        row.innerHTML = `
            <label>
                <input type="checkbox" value="${rem.time}" ${rem.active ? 'checked' : ''} 
                       onchange="updateReminderStatus(${index}, this.checked)"> 
                ${rem.time}
            </label>
            <div class="daily-wrapper">
                <span>Daily</span>
                <label class="switch small">
                    <input type="checkbox" class="daily-toggle" ${rem.daily ? 'checked' : ''} 
                           onchange="updateReminderType(${index}, this.checked)">
                    <span class="slider"></span>
                </label>
                <button onclick="deleteReminder(${index})" style="background:none; border:none; margin-left:10px; cursor:pointer;">🗑️</button>
            </div>
        `;
        container.appendChild(row);
    });

    // CRITICAL: Refresh the summary list whenever the main list is rendered
    loadReminders(); 
}

// Helper to display human-readable time
function formatTo12Hr(time24) {
    if (!time24) return "";
    let [hours, minutes] = time24.split(':');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
    syncToCloud();
}


window.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial UI Setup
    setNotifMode('specific');

    // 2. Fetch Fresh Data from MongoDB
    // We 'await' this so the global 'data' object is fully populated
    await loadUserData(); 

    // ✅ FIX 1: Sidebar Profile Sync
    // Only update if isDataReady is true to prevent using placeholder values
    if (isDataReady && data.username) {
        const nameDisplay = document.getElementById('username-display');
        const initialDisplay = document.getElementById('user-initial');
        
        if (nameDisplay) nameDisplay.innerText = data.username;
        if (initialDisplay) initialDisplay.innerText = data.username[0].toUpperCase();
    }

    // ✅ FIX 2: Strict Post-Meal Toggle Sync
    const postMealToggle = document.getElementById('post-meal-toggle');
    if (postMealToggle) {
        // Only check the box if the cloud data explicitly says 'true'
        postMealToggle.checked = (data.postMealEnabled === true);
    }

    // 3. Goal Input Initialization
    const goalInput = document.getElementById('goal-val');
    if (goalInput && data.goal) {
        // Convert ml from MongoDB back to Liters for the input field
        goalInput.value = (data.goal / 1000).toFixed(1); 
    }

    // 4. Handle Default Reminders (Only for first-time users)
    if (isDataReady && (!data.reminders || data.reminders.length === 0)) {
        data.reminders = [
            { time: "07:00", daily: true, active: false },
            { time: "11:00", daily: true, active: false },
            { time: "14:00", daily: true, active: false },
            { time: "17:00", daily: true, active: false }
        ];

        // Save these defaults to the cloud so they persist
        await syncToCloud(); 
    }

    // 5. Render the UI
    // This populates the list of reminders and the summary
    renderCloudReminders();
});

function saveInterval() {
    const intervalInput = document.getElementById('interval-min');
    const intervalValue = intervalInput.value;

    // Check if the value is empty, null, or less than/equal to 0
    if (!intervalValue || intervalValue <= 0) {
        showNotification("❌ Please enter a number or a value");
    } else {
        // Here you would typically save the value to localStorage
        localStorage.setItem('hydrationInterval', intervalValue);
        
        showNotification(`✅ Time interval saved: ${intervalValue} minutes`);
        
        // Hide the done button after saving (optional, matches your previous logic)
        document.getElementById('interval-done-btn').style.display = 'none';
    }
}

function checkIntervalInput() {
    const input = document.getElementById('interval-min');
    const doneBtn = document.getElementById('interval-done-btn');
    
    // Show the button as soon as there is any text in the box
    if (input.value.length > 0) {
        doneBtn.style.display = 'block';
    } else {
        doneBtn.style.display = 'none';
    }
}

// Add this inside your script or at the top of settings.js
function handlePointer(e) {
    const b = document.getElementById('waves-bg').getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Update the global mouse object used by the WaterWaves class
    if (window.wavesInstance) {
        window.wavesInstance.mouse.x = x - b.left;
        window.wavesInstance.mouse.y = y - b.top;
        window.wavesInstance.mouse.set = true;
    }
}

window.addEventListener('mousemove', handlePointer);
window.addEventListener('touchmove', handlePointer, { passive: true });

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg'; // Styling from insights.css or global
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}


function saveInterval() {
    const intervalValue = document.getElementById('interval-min').value;
    if (!intervalValue || intervalValue <= 0) {
        showToast("❌ Please enter a valid interval");
    } else {
        showToast(`✅ Reminders set every ${intervalValue} minutes`);
    }
}
