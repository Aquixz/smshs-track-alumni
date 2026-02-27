// IndexedDB setup (same as admin.js)
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

// Get all events from IndexedDB
function getAllEventsFromDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve([]);
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

window.onload = async function() {
    try {
        await initDB();
        console.log("Event viewer: IndexedDB initialized");
        displayEvents();
    } catch (err) {
        console.error("Event viewer: Failed to initialize IndexedDB:", err);
        // Fallback to localStorage
        displayEvents();
    }
};

async function displayEvents() {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;

    let savedEvents = [];
    
    try {
        // Try to get from IndexedDB first
        if (db) {
            savedEvents = await getAllEventsFromDB();
            console.log("Loaded " + savedEvents.length + " events from IndexedDB");
        }
    } catch (err) {
        console.error("Error loading from IndexedDB:", err);
    }

    // Fallback to localStorage if IndexedDB is empty or failed
    if (savedEvents.length === 0) {
        savedEvents = JSON.parse(localStorage.getItem('global_events')) || [];
        console.log("Loaded " + savedEvents.length + " events from localStorage (fallback)");
    }

    // Clear existing static events
    eventList.innerHTML = '';

    if (savedEvents.length === 0) {
        eventList.innerHTML = '<p class="subtitle" style="text-align:center; color:#8b9dc3;">No events posted yet.</p>';
        return;
    }

    // Sort by date (newest first)
    savedEvents.sort((a, b) => new Date(b.fullDate || b.createdAt) - new Date(a.fullDate || a.createdAt));

    savedEvents.forEach(event => {
        const dateParts = event.date ? event.date.split(' ') : ["--", "--"];
        const day = dateParts[1] || "--";
        const month = dateParts[0] || "--";
        
        const card = document.createElement('div');
        card.className = 'event-card';
        card.onclick = () => openLiveEvent(event.id);
        
        // Check if event has media
        const hasMedia = event.media ? '📎 ' : '';
        
        card.innerHTML = `
            <div class="event-date">
                <span class="day">${day}</span>
                <span class="month">${month}</span>
            </div>
            <div class="event-info">
                <h3>${hasMedia}${event.title}</h3>
                <p>${event.description ? event.description.substring(0, 100) + '...' : 'No description'}</p>
                <span class="tag">School News</span>
            </div>
        `;
        eventList.appendChild(card);
    });
}

async function openLiveEvent(eventId) {
    let event = null;
    
    // Try to get from IndexedDB first
    if (db) {
        try {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(eventId);
            
            event = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error("Error getting event from IndexedDB:", err);
        }
    }
    
    // Fallback to localStorage
    if (!event) {
        const savedEvents = JSON.parse(localStorage.getItem('global_events')) || [];
        event = savedEvents.find(e => e.id === eventId);
    }

    if (!event) {
        console.error("Event not found:", eventId);
        return;
    }

    const modal = document.getElementById('eventModal');
    const modalBody = document.getElementById('modalBody');
    const modalContent = document.querySelector('.modal-content');

    if (modalBody) {
        modalBody.style.display = "block";
        modalBody.style.padding = "0";
    }
    
    if (modalContent) {
        modalContent.style.overflowY = "auto";
        modalContent.style.display = "flex";
        modalContent.style.flexDirection = "column";
    }

    let mediaHtml = '';
    if (event.media) {
        if (event.type && event.type.includes('video')) {
            mediaHtml = `<div class="modal-media" style="width:100%; background: #000; line-height: 0; flex-shrink: 0;">
                            <video controls autoplay style="width:100%; height: auto; max-height: 65vh; display:block;">
                                <source src="${event.media}" type="${event.type}">
                                Your browser does not support the video tag.
                            </video>
                         </div>`;
        } else {
            mediaHtml = `<div class="modal-media" style="width:100%; background: #000; line-height: 0; flex-shrink: 0;">
                            <img src="${event.media}" alt="event image" style="width:100%; height: auto; max-height: 65vh; display:block; object-fit: contain;">
                         </div>`;
        }
    }

    if (modalBody) {
        modalBody.innerHTML = `
            ${mediaHtml}
            <div class="modal-text" style="padding: 30px; color: white; background: #1a2332; position: relative; min-height: min-content;">
                <span style="color: #4a90e2; font-weight: bold; font-size: 14px; display: block; margin-bottom: 5px;">${event.date || 'No date'}</span>
                <h2 style="margin: 0; font-size: 26px; line-height: 1.3; text-align: left; color: white;">${event.title || 'Untitled'}</h2>
                <hr style="border: 0; border-top: 1px solid #2d3748; margin: 15px 0;">
                <p style="white-space: pre-wrap; line-height: 1.6; color: #cbd5e0; font-size: 16px; margin: 0; padding-bottom: 20px;">${event.description || 'No description'}</p>
            </div>
        `;
    }

    if (modal) {
        modal.style.display = "block";
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    }
}

function closeEvent() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('eventModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Add this at the end of event-viewer.js to migrate old events to IndexedDB
async function migrateOldEvents() {
    const oldEvents = JSON.parse(localStorage.getItem('global_events')) || [];
    if (oldEvents.length > 0 && db) {
        console.log("Migrating " + oldEvents.length + " old events to IndexedDB...");
        for (const event of oldEvents) {
            try {
                await saveEventToDB(event);
            } catch (e) {
                console.error("Failed to migrate event:", e);
            }
        }
        // Clear old localStorage after migration
        localStorage.removeItem('global_events');
        console.log("Migration complete");
    }
}

// Call this after initDB in window.onload