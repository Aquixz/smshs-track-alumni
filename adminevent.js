// Data Management
let currentTab = 'alumni';
// Ensure we use the keys used in your registration
let allAlumni = JSON.parse(localStorage.getItem("registered_alumni")) || JSON.parse(localStorage.getItem("alumni")) || [];
let allStudents = JSON.parse(localStorage.getItem("students")) || [];

// Maximum file size: 1GB in bytes
const MAX_FILE_SIZE = 1073741824; // 1GB = 1024 * 1024 * 1024 bytes

// --- TAB SWITCHING LOGIC ---
function switchTab(tab) {
    currentTab = tab;
    
    const recordsSection = document.getElementById("recordsSection");
    const eventsSection = document.getElementById("eventsSection");
    const adminActions = document.querySelector(".admin-actions");
    const searchSection = document.querySelector(".search-section");
    const statsBar = document.querySelector(".stats-bar");

    // Update Button States - Added checks so it doesn't error if IDs are missing
    const alb = document.getElementById("alumniTab");
    const stb = document.getElementById("studentsTab");
    const evb = document.getElementById("eventsTab");
    if(alb) alb.classList.toggle("active", tab === "alumni");
    if(stb) stb.classList.toggle("active", tab === "students");
    if(evb) evb.classList.toggle("active", tab === "events");

    if (tab === 'events') {
        if(recordsSection) recordsSection.style.display = "none";
        if(searchSection) searchSection.style.display = "none";
        if(statsBar) statsBar.style.display = "none";
        if(adminActions) adminActions.style.display = "none"; 
        
        if(eventsSection) {
            eventsSection.style.display = "block";
            displayAdminEvents(); 
        }
    } else {
        if(recordsSection) recordsSection.style.display = "block";
        if(searchSection) searchSection.style.display = "block";
        if(statsBar) statsBar.style.display = "block";
        if(adminActions) adminActions.style.display = "block";
        
        if(eventsSection) eventsSection.style.display = "none";
        
        const statusFilter = document.getElementById("filterStatus");
        if(statusFilter) statusFilter.style.display = (tab === "alumni") ? "block" : "none";
        
        // Only run search if we are NOT in events tab
        searchRecords(); 
    }
}

// --- EVENT PUBLISHING LOGIC ---
function updateFileLabel() {
    const fileInput = document.getElementById('eventMedia');
    const label = document.getElementById('fileStatus');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        // Check if file exceeds 1GB limit
        if (file.size > MAX_FILE_SIZE) {
            label.innerText = "❌ File too large! Maximum size is 1GB. Your file: " + fileSizeMB + " MB";
            label.style.color = "#e11d48";
            fileInput.value = ""; // Clear the file input
        } else {
            label.innerText = "✅ Selected: " + file.name + " (" + fileSizeMB + " MB)";
            label.style.color = "#10b981";
        }
    }
}

function publishEvent() {
    // Check if function is firing
    console.log("Publishing initiated...");

    const titleInput = document.getElementById('eventTitle');
    const descInput = document.getElementById('eventDesc');
    const dateInput = document.getElementById('eventDate');
    const mediaInput = document.getElementById('eventMedia');

    if (!titleInput.value || !descInput.value || !dateInput.value) {
        alert("Please fill in the title, description, and event date!");
        return;
    }

    const file = mediaInput.files[0];
    
    // Validate file size before processing
    if (file && file.size > MAX_FILE_SIZE) {
        const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        alert("File size exceeds the 1GB limit! Your file is " + fileSizeGB + " GB. Please select a smaller file.");
        return;
    }
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveToStorage(titleInput.value, descInput.value, dateInput.value, e.target.result, file.type);
        };
        reader.readAsDataURL(file);
    } else {
        saveToStorage(titleInput.value, descInput.value, dateInput.value, null, null);
    }
}

function saveToStorage(title, desc, dateValue, mediaData, mediaType) {
    const events = JSON.parse(localStorage.getItem('global_events')) || [];
    
    const dateObj = new Date(dateValue);
    const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();

    const newEvent = {
        id: 'event_' + Date.now(),
        title: title,
        description: desc,
        media: mediaData,
        type: mediaType,
        date: formattedDate,
        fullDate: dateValue
    };

    events.unshift(newEvent);
    localStorage.setItem('global_events', JSON.stringify(events));

    alert("🚀 Event Published Successfully!");
    
    // Reset Form safely
    document.getElementById('eventTitle').value = "";
    document.getElementById('eventDesc').value = "";
    document.getElementById('eventDate').value = "";
    document.getElementById('fileStatus').innerText = "Click to select Image or Video";
    
    displayAdminEvents();
}

// --- DELETE LOGIC ---
function displayAdminEvents() {
    const adminEventList = document.getElementById('adminEventList');
    if (!adminEventList) return;

    const events = JSON.parse(localStorage.getItem('global_events')) || [];
    adminEventList.innerHTML = events.length === 0 ? 
        '<p style="color: #8b9dc3; text-align: center; padding: 20px;">No active events found.</p>' : '';

    events.forEach(event => {
        const item = document.createElement('div');
        item.style.cssText = "background: #242b3d; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #e11d48;";
        item.innerHTML = `
            <div style="color: white;">
                <strong>${event.title}</strong><br>
                <small style="color: #8b9dc3;">${event.date}</small>
            </div>
            <button onclick="deleteEvent('${event.id}')" style="background: #e11d48; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Delete</button>
        `;
        adminEventList.appendChild(item);
    });
}

function deleteEvent(id) {
    if (confirm("Remove this event?")) {
        let events = JSON.parse(localStorage.getItem('global_events')) || [];
        events = events.filter(e => e.id !== id);
        localStorage.setItem('global_events', JSON.stringify(events));
        displayAdminEvents();
    }
}

// --- RECORDS MANAGEMENT ---
function searchRecords() {
    const searchInput = document.getElementById("searchInput");
    if(!searchInput) return; // Prevent crash if element is missing

    const searchTerm = searchInput.value.toLowerCase();
    const records = (currentTab === 'alumni') ? allAlumni : allStudents;
    
    const filtered = records.filter(r => 
        (r.name && r.name.toLowerCase().includes(searchTerm)) ||
        (r.lrn && r.lrn.includes(searchTerm))
    );
    
    displayRecords(filtered);
}

function displayRecords(recordsToShow) {
    const list = document.getElementById("list");
    if(!list) return;
    list.innerHTML = "";
    
    recordsToShow.forEach(record => {
        const li = document.createElement('li');
        li.style.color = "white";
        li.style.marginBottom = "10px";
        li.innerHTML = `<strong>${record.name}</strong> - LRN: ${record.lrn}`;
        list.appendChild(li);
    });
}

window.onload = () => {
    switchTab('alumni');
};