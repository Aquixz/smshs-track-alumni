let currentTab = 'alumni';
let allAlumni = JSON.parse(localStorage.getItem("alumni")) || [];
let allStudents = JSON.parse(localStorage.getItem("students")) || [];
let currentFilteredRecords = [];
const list = document.getElementById("list");

// Maximum file size: 50MB (IndexedDB limit is higher but let's be safe)
const MAX_FILE_SIZE = 52428800; // 50MB = 50 * 1024 * 1024

// IndexedDB setup
let db;
const DB_NAME = 'AlumniEventsDB';
const STORE_NAME = 'events';
const DB_VERSION = 1;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

// Save event to IndexedDB
function saveEventToDB(event) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(event);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Get all events from IndexedDB
function getAllEventsFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Delete event from IndexedDB
function deleteEventFromDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function switchTab(tab) {
    currentTab = tab;
    
    const alumniTab = document.getElementById("alumniTab");
    const studentsTab = document.getElementById("studentsTab");
    const eventsTab = document.getElementById("eventsTab");
    
    if (alumniTab) alumniTab.classList.toggle("active", tab === "alumni");
    if (studentsTab) studentsTab.classList.toggle("active", tab === "students");
    if (eventsTab) eventsTab.classList.toggle("active", tab === "events");
    
    const recordsSection = document.getElementById("recordsSection");
    const eventsSection = document.getElementById("eventsSection");
    const adminActions = document.querySelector(".admin-actions");
    
    if (recordsSection) recordsSection.style.display = tab === 'events' ? 'none' : 'block';
    if (eventsSection) eventsSection.style.display = tab === 'events' ? 'block' : 'none';
    if (adminActions) adminActions.style.display = tab === 'events' ? 'none' : 'block';
    
    const filterStatus = document.getElementById("filterStatus");
    if (filterStatus) filterStatus.style.display = tab === "alumni" ? "inline-block" : "none";
    
    if (tab !== 'events') {
        const searchInput = document.getElementById("searchInput");
        const filterStrand = document.getElementById("filterStrand");
        const filterYear = document.getElementById("filterYear");
        
        if (searchInput) searchInput.value = "";
        if (filterStrand) filterStrand.value = "";
        if (filterYear) filterYear.value = "";
        if (filterStatus) filterStatus.value = "";
        
        searchRecords();
    } else {
        displayAdminEvents();
    }
}

function updateFileLabel() {
    const fileInput = document.getElementById('eventMedia');
    const label = document.getElementById('fileStatus');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        if (file.size > MAX_FILE_SIZE) {
            label.innerText = "❌ File too large! Maximum size is 50MB. Your file: " + fileSizeMB + " MB";
            label.style.color = "#e11d48";
            fileInput.value = "";
        } else {
            label.innerText = "✅ Selected: " + file.name + " (" + fileSizeMB + " MB)";
            label.style.color = "#10b981";
        }
    }
}

async function publishEvent() {
    console.log("publishEvent() called");

    const titleInput = document.getElementById('eventTitle');
    const descInput = document.getElementById('eventDesc');
    const dateInput = document.getElementById('eventDate');
    const mediaInput = document.getElementById('eventMedia');

    if (!titleInput || !descInput || !dateInput) {
        alert("Error: Form elements not found.");
        return;
    }

    if (!titleInput.value.trim() || !descInput.value.trim() || !dateInput.value) {
        alert("Please fill in the title, description, and event date!");
        return;
    }

    const file = mediaInput && mediaInput.files ? mediaInput.files[0] : null;
    
    if (file && file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert("File size exceeds the 50MB limit! Your file is " + fileSizeMB + " MB. Please select a smaller file.");
        return;
    }
    
    try {
        // Ensure DB is initialized
        if (!db) {
            await initDB();
        }
        
        let mediaData = null;
        let mediaType = null;
        
        if (file) {
            console.log("Reading file...");
            mediaData = await readFileAsDataURL(file);
            mediaType = file.type;
        }
        
        const dateObj = new Date(dateInput.value);
        const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();

        const newEvent = {
            id: 'event_' + Date.now(),
            title: titleInput.value.trim(),
            description: descInput.value.trim(),
            media: mediaData,
            type: mediaType,
            date: formattedDate,
            fullDate: dateInput.value,
            createdAt: new Date().toISOString()
        };

        await saveEventToDB(newEvent);
        
        // Also save minimal data to localStorage for compatibility with event.html
        const eventsList = JSON.parse(localStorage.getItem('global_events_list')) || [];
        eventsList.unshift({
            id: newEvent.id,
            title: newEvent.title,
            description: newEvent.description.substring(0, 100),
            date: newEvent.date,
            fullDate: newEvent.fullDate,
            hasMedia: !!mediaData
        });
        localStorage.setItem('global_events_list', JSON.stringify(eventsList.slice(0, 50))); // Keep only last 50

        alert("🚀 Event Published Successfully!");
        
        // Reset Form
        titleInput.value = "";
        descInput.value = "";
        dateInput.value = "";
        const fileStatus = document.getElementById('fileStatus');
        if (fileStatus) {
            fileStatus.innerText = "Click to select Image or Video";
            fileStatus.style.color = "#8b9dc3";
        }
        if (mediaInput) mediaInput.value = "";
        
        displayAdminEvents();
        
    } catch (error) {
        console.error("Error saving event:", error);
        alert("Error saving event: " + error.message);
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

async function displayAdminEvents() {
    console.log("displayAdminEvents() called");
    const adminEventList = document.getElementById('adminEventList');
    if (!adminEventList) return;

    try {
        if (!db) {
            await initDB();
        }
        
        const events = await getAllEventsFromDB();
        console.log("Found " + events.length + " events");
        
        if (events.length === 0) {
            adminEventList.innerHTML = '<p style="color: #8b9dc3; text-align: center; padding: 20px;">No active events found.</p>';
            return;
        }

        adminEventList.innerHTML = '';
        events.forEach(event => {
            const item = document.createElement('div');
            item.style.cssText = "background: #242b3d; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #e11d48;";
            
            const hasMedia = event.media ? '📎 ' : '';
            const desc = event.description || '';
            item.innerHTML = `
                <div style="color: white; flex: 1;">
                    <strong>${hasMedia}${event.title}</strong><br>
                    <small style="color: #8b9dc3;">${event.date} • ${desc.substring(0, 50)}${desc.length > 50 ? '...' : ''}</small>
                </div>
                <button onclick="deleteEvent('${event.id}')" style="background: #e11d48; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Delete</button>
            `;
            adminEventList.appendChild(item);
        });
    } catch (error) {
        console.error("Error displaying events:", error);
        adminEventList.innerHTML = '<p style="color: #e11d48; text-align: center; padding: 20px;">Error loading events: ' + error.message + '</p>';
    }
}

async function deleteEvent(id) {
    if (confirm("Remove this event?")) {
        try {
            if (!db) {
                await initDB();
            }
            
            await deleteEventFromDB(id);
            
            // Update localStorage list too
            let eventsList = JSON.parse(localStorage.getItem('global_events_list')) || [];
            eventsList = eventsList.filter(e => e.id !== id);
            localStorage.setItem('global_events_list', JSON.stringify(eventsList));
            
            displayAdminEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Error deleting event: " + error.message);
        }
    }
}

// --- RECORDS MANAGEMENT (same as before) ---
function displayRecords(recordsToShow) {
    if (!list) return;
    list.innerHTML = "";
    currentFilteredRecords = recordsToShow;
    
    if (recordsToShow.length === 0) {
        list.innerHTML = "<li class='no-results'>No records found matching your filters</li>";
        const showingRecords = document.getElementById("showingRecords");
        if (showingRecords) showingRecords.textContent = "Showing: 0 filtered";
        return;
    }

    recordsToShow.forEach((record, index) => {
        const originalArray = currentTab === 'alumni' ? allAlumni : allStudents;
        const originalIndex = originalArray.findIndex(r => 
            r.lrn === record.lrn && r.name === record.name
        );

        const avatarContent = record.profileImage
            ? `<img src="${record.profileImage}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 15px;">`
            : `<div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 24px;">👤</div>`;

        if (currentTab === 'alumni') {
            list.innerHTML += `
                <li class="record-item alumni-record">
                    <div class="record-header" style="display: flex; align-items: center;">
                        ${avatarContent}
                        <div>
                            <strong>${record.name}</strong>
                            <span class="badge">${formatStrand(record.strand)}</span>
                        </div>
                    </div>
                    <div class="record-details">
                        <div class="detail-col">
                            <p><b>LRN:</b> ${record.lrn}</p>
                            <p><b>Age:</b> ${record.age || 'N/A'}</p>
                            <p><b>Sex:</b> ${record.sex || 'N/A'}</p>
                            <p><b>Year Graduated:</b> ${record.year || 'N/A'}</p>
                        </div>
                        <div class="detail-col">
                            <p><b>Email:</b> ${record.email || 'N/A'}</p>
                            <p><b>Status:</b> ${formatStatus(record.currentStatus)}</p>
                            <p><b>Course:</b> ${record.courseTaken || 'N/A'}</p>
                            <p><b>Aligned:</b> ${record.aligned || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="button-group">
                        <button onclick="viewRecord(${index})" class="view-btn">👁️ View Full Profile</button>
                        <button onclick="removeRecord(${originalIndex})" class="delete-btn">🗑️ Delete</button>
                    </div>
                </li>
            `;
        } else {
            list.innerHTML += `
                <li class="record-item student-record">
                    <div class="record-header" style="display: flex; align-items: center;">
                        ${avatarContent}
                        <div>
                            <strong>${record.name}</strong>
                            <span class="badge student-badge">Student</span>
                        </div>
                    </div>
                    <div class="record-details">
                        <div class="detail-col">
                            <p><b>LRN:</b> ${record.lrn}</p>
                            <p><b>Strand:</b> ${formatStrand(record.strand)}</p>
                            <p><b>Year:</b> ${record.year || 'N/A'}</p>
                        </div>
                        <div class="detail-col">
                            <p><b>Email:</b> ${record.email || 'N/A'}</p>
                            <p><b>Username:</b> ${record.username || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="button-group">
                        <button onclick="viewRecord(${index})" class="view-btn">👁️ View Full Profile</button>
                        <button onclick="removeStudent(${originalIndex})" class="delete-btn">🗑️ Delete</button>
                    </div>
                </li>
            `;
        }
    });
    
    const showingRecords = document.getElementById("showingRecords");
    if (showingRecords) showingRecords.textContent = `Showing: ${recordsToShow.length} filtered`;
}

function viewRecord(index) {
    const record = currentFilteredRecords[index];
    if (!record) return;
    
    const modal = document.getElementById("viewModal");
    const modalBody = document.getElementById("modalBody");
    if (!modal || !modalBody) return;
    
    const avatarContent = record.profileImage
        ? `<img src="${record.profileImage}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 4px solid rgba(255,255,255,0.3);">`
        : `<div style="width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 15px; font-size: 60px; border: 4px solid rgba(255,255,255,0.3);">👤</div>`;
    
    if (currentTab === 'alumni') {
        modalBody.innerHTML = `
            <div style="text-align: center;">
                ${avatarContent}
                <h3 style="margin-bottom: 5px;">${record.name || 'Unknown'}</h3>
                <span style="background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px;">Alumni</span>
            </div>
            <div class="info-section" style="margin-top: 20px;">
                <h4>Personal Information</h4>
                <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${record.name || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Last Name:</span><span class="info-value">${record.lastName || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">First Name:</span><span class="info-value">${record.firstName || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Middle Name:</span><span class="info-value">${record.middleName || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Age:</span><span class="info-value">${record.age || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Sex:</span><span class="info-value">${record.sex || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">LRN:</span><span class="info-value">${record.lrn || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${record.email || 'N/A'}</span></div>
            </div>
            <div class="info-section">
                <h4>Education Background</h4>
                <div class="info-row"><span class="info-label">Strand:</span><span class="info-value">${formatStrand(record.strand)}</span></div>
                <div class="info-row"><span class="info-label">Year Graduated:</span><span class="info-value">${record.year || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Current Status:</span><span class="info-value">${formatStatus(record.currentStatus)}</span></div>
                <div class="info-row"><span class="info-label">Course Taken:</span><span class="info-value">${record.courseTaken || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Course Aligned:</span><span class="info-value">${record.aligned || 'N/A'}</span></div>
            </div>
        `;
    } else {
        modalBody.innerHTML = `
            <div style="text-align: center;">
                ${avatarContent}
                <h3 style="margin-bottom: 5px;">${record.name || 'Unknown'}</h3>
                <span style="background: #2196F3; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px;">Student</span>
            </div>
            <div class="info-section" style="margin-top: 20px;">
                <h4>Personal Information</h4>
                <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${record.name || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">LRN:</span><span class="info-value">${record.lrn || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${record.email || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Username:</span><span class="info-value">${record.username || 'N/A'}</span></div>
            </div>
            <div class="info-section">
                <h4>Academic Information</h4>
                <div class="info-row"><span class="info-label">Strand:</span><span class="info-value">${formatStrand(record.strand)}</span></div>
                <div class="info-row"><span class="info-label">Year:</span><span class="info-value">${record.year || 'N/A'}</span></div>
            </div>
        `;
    }
    
    modal.style.display = "flex";
}

function closeModal(event) {
    if (!event || event.target.id === "viewModal" || event.target.className === "close-modal") {
        const modal = document.getElementById("viewModal");
        if (modal) modal.style.display = "none";
    }
}

function formatStrand(strand) {
    const strandMap = {
        'programming': 'TVL - Programming',
        'fbs-cookery': 'TVL - FBS/Cookery',
        'animation': 'TVL - Animation',
        'beautycare': 'TVL - Beauty Care',
        'eim': 'TVL - EIM',
        'stem': 'STEM',
        'abm': 'ABM',
        'humss': 'HUMSS'
    };
    return strandMap[strand] || strand || 'N/A';
}

function formatStatus(status) {
    const statusMap = {
        'currently-enrolled': 'Currently Enrolled',
        'completed-college': 'Completed College',
        'never-pursued': 'Never Pursued College'
    };
    return statusMap[status] || status || 'N/A';
}

function searchRecords() {
    const searchInput = document.getElementById("searchInput");
    const filterStrand = document.getElementById("filterStrand");
    const filterYear = document.getElementById("filterYear");
    const filterStatus = document.getElementById("filterStatus");

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const strandFilter = filterStrand ? filterStrand.value : "";
    const yearFilter = filterYear ? filterYear.value : "";
    const statusFilter = filterStatus ? filterStatus.value : "";

    allAlumni = JSON.parse(localStorage.getItem("alumni")) || [];
    allStudents = JSON.parse(localStorage.getItem("students")) || [];
    
    let records = currentTab === 'alumni' ? [...allAlumni] : [...allStudents];
    
    const filtered = records.filter(r => {
        const matchesSearch = !searchTerm || 
            (r.name && r.name.toLowerCase().includes(searchTerm)) ||
            (r.lrn && r.lrn.includes(searchTerm)) ||
            (r.strand && r.strand.toLowerCase().includes(searchTerm)) ||
            (r.year && r.year.toString().includes(searchTerm)) ||
            (r.firstName && r.firstName.toLowerCase().includes(searchTerm)) ||
            (r.lastName && r.lastName.toLowerCase().includes(searchTerm));
        
        const matchesStrand = !strandFilter || r.strand === strandFilter;
        const matchesYear = !yearFilter || r.year === yearFilter;
        const matchesStatus = !statusFilter || r.currentStatus === statusFilter;
        
        return matchesSearch && matchesStrand && matchesYear && matchesStatus;
    });

    displayRecords(filtered);
    updateStats();
}

function removeRecord(index) {
    if(confirm("Are you sure you want to delete this alumni record?")) {
        allAlumni.splice(index, 1);
        localStorage.setItem("alumni", JSON.stringify(allAlumni));
        searchRecords();
        updateStats();
    }
}

function removeStudent(index) {
    if(confirm("Are you sure you want to delete this student record?")) {
        allStudents.splice(index, 1);
        localStorage.setItem("students", JSON.stringify(allStudents));
        searchRecords();
        updateStats();
    }
}

function updateStats() {
    const totalRecords = document.getElementById("totalRecords");
    const showingRecords = document.getElementById("showingRecords");
    
    const total = currentTab === 'alumni' ? allAlumni.length : allStudents.length;
    const showing = currentFilteredRecords ? currentFilteredRecords.length : 0;
    
    if (totalRecords) totalRecords.textContent = `Total ${currentTab}: ${total} records`;
    if (showingRecords) showingRecords.textContent = `Showing: ${showing} filtered`;
}

function exportData() {
    const data = currentTab === 'alumni' ? allAlumni : allStudents;
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTab}_data.json`;
    a.click();
}

// Initialize DB on load
initDB().then(() => {
    console.log("IndexedDB initialized successfully");
    switchTab('alumni');
}).catch(err => {
    console.error("Failed to initialize IndexedDB:", err);
    // Fallback to localStorage if IndexedDB fails
    switchTab('alumni');
});