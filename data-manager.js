// ==========================================
// DATA MANAGER - Central Storage Handler
// ==========================================

const DataManager = {
    // Keys used across the application
    KEYS: {
        ALUMNI: 'alumni',
        REGISTERED_ALUMNI: 'registered_alumni',
        STUDENTS: 'students',
        USERS: 'users',
        CURRENT_USER: 'currentUser',
        NOTIFICATIONS: 'notifications',
        SYSTEM_UPDATES: 'systemUpdates',
        EVENTS: 'events',
        ADMIN_LOGGED_IN: 'isAdminLoggedIn'
    },

    // ==========================================
    // GET DATA METHODS
    // ==========================================

    getAlumni() {
        return JSON.parse(localStorage.getItem(this.KEYS.ALUMNI)) || 
               JSON.parse(localStorage.getItem(this.KEYS.REGISTERED_ALUMNI)) || [];
    },

    getStudents() {
        return JSON.parse(localStorage.getItem(this.KEYS.STUDENTS)) || [];
    },

    getUsers() {
        return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
    },

    getCurrentUser() {
        // First check sessionStorage (tab-specific)
        const sessionData = sessionStorage.getItem('activeSession');
        if (sessionData) {
            return JSON.parse(sessionData);
        }
        // Fallback to localStorage
        const localData = localStorage.getItem(this.KEYS.CURRENT_USER);
        if (localData) {
            const user = JSON.parse(localData);
            sessionStorage.setItem('activeSession', localData);
            return user;
        }
        return null;
    },

    getNotifications() {
        return JSON.parse(localStorage.getItem(this.KEYS.NOTIFICATIONS)) || [];
    },

    getSystemUpdates() {
        return JSON.parse(localStorage.getItem(this.KEYS.SYSTEM_UPDATES)) || [];
    },

    getEvents() {
        return JSON.parse(localStorage.getItem(this.KEYS.EVENTS)) || [];
    },

    // ==========================================
    // SAVE DATA METHODS
    // ==========================================

    saveAlumni(alumni) {
        localStorage.setItem(this.KEYS.ALUMNI, JSON.stringify(alumni));
        localStorage.setItem(this.KEYS.REGISTERED_ALUMNI, JSON.stringify(alumni));
    },

    saveStudents(students) {
        localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify(students));
    },

    saveUsers(users) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },

    saveCurrentUser(user) {
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const sessionData = { ...user, sessionId, loginTime: new Date().toISOString() };
        
        localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(sessionData));
        sessionStorage.setItem('activeSession', JSON.stringify(sessionData));
        
        return sessionData;
    },

    saveNotifications(notifications) {
        localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    },

    saveSystemUpdates(updates) {
        localStorage.setItem(this.KEYS.SYSTEM_UPDATES, JSON.stringify(updates));
    },

    saveEvents(events) {
        localStorage.setItem(this.KEYS.EVENTS, JSON.stringify(events));
    },

    // ==========================================
    // FIND METHODS
    // ==========================================

    findAlumniById(id) {
        const alumni = this.getAlumni();
        return alumni.find(a => a.lrn === id || a.id === id);
    },

    findAlumniByLRN(lrn) {
        const alumni = this.getAlumni();
        return alumni.find(a => a.lrn === lrn);
    },

    findStudentByLRN(lrn) {
        const students = this.getStudents();
        return students.find(s => s.lrn === lrn);
    },

    findUserByUsername(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username);
    },

    // ==========================================
    // UPDATE METHODS
    // ==========================================

    updateAlumni(updatedAlumni) {
        let alumni = this.getAlumni();
        const index = alumni.findIndex(a => a.lrn === updatedAlumni.lrn);
        
        if (index !== -1) {
            alumni[index] = { ...alumni[index], ...updatedAlumni };
        } else {
            alumni.push(updatedAlumni);
        }
        
        this.saveAlumni(alumni);
        return alumni;
    },

    updateStudent(updatedStudent) {
        let students = this.getStudents();
        const index = students.findIndex(s => s.lrn === updatedStudent.lrn);
        
        if (index !== -1) {
            students[index] = { ...students[index], ...updatedStudent };
        } else {
            students.push(updatedStudent);
        }
        
        this.saveStudents(students);
        return students;
    },

    updateUser(updatedUser) {
        let users = this.getUsers();
        const index = users.findIndex(u => u.username === updatedUser.username);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUser };
            this.saveUsers(users);
        }
        
        return users;
    },

    // ==========================================
    // DELETE METHODS
    // ==========================================

    deleteAlumni(lrn) {
        let alumni = this.getAlumni();
        alumni = alumni.filter(a => a.lrn !== lrn);
        this.saveAlumni(alumni);
        return alumni;
    },

    deleteStudent(lrn) {
        let students = this.getStudents();
        students = students.filter(s => s.lrn !== lrn);
        this.saveStudents(students);
        return students;
    },

    // ==========================================
    // NOTIFICATION METHODS
    // ==========================================

    createNotification(alumniData, changes) {
        const notifications = this.getNotifications();
        
        const changeMessages = changes.map(change => {
            switch(change) {
                case 'name': return 'name';
                case 'currentStatus': return `employment status to "${alumniData.currentStatus}"`;
                case 'courseTaken': return `course to "${alumniData.courseTaken}"`;
                case 'email': return 'contact information';
                case 'age': return `age to ${alumniData.age}`;
                case 'strand': return `strand to "${alumniData.strand}"`;
                case 'year': return `graduation year to ${alumniData.year}`;
                case 'aligned': return `course alignment to "${alumniData.aligned}"`;
                case 'profileImage': return 'profile picture';
                default: return change;
            }
        });

        let message;
        if (changeMessages.length === 1) {
            message = `${alumniData.name} updated their ${changeMessages[0]}.`;
        } else if (changeMessages.length === 2) {
            message = `${alumniData.name} updated their ${changeMessages[0]} and ${changeMessages[1]}.`;
        } else {
            message = `${alumniData.name} updated their profile information (${changeMessages.length} changes).`;
        }

        const notification = {
            id: Date.now(),
            type: "profile_update",
            alumniName: alumniData.name,
            alumniId: alumniData.lrn,
            changes: changes,
            changeDetails: changeMessages,
            message: message,
            timestamp: new Date().toISOString(),
            read: false,
            updatedFields: { ...alumniData }
        };

        notifications.unshift(notification);
        this.saveNotifications(notifications);
        
        // Also create system update
        this.createSystemUpdate(notification);
        
        return notification;
    },

    createSystemUpdate(notification) {
        const updates = this.getSystemUpdates();
        
        const update = {
            id: notification.id,
            type: "alumni_update",
            title: "Profile Update",
            message: notification.message,
            alumniName: notification.alumniName,
            alumniId: notification.alumniId,
            timestamp: notification.timestamp,
            read: false,
            details: notification.changeDetails
        };

        updates.unshift(update);
        this.saveSystemUpdates(updates);
        
        return update;
    },

    markNotificationAsRead(notifId) {
        // Check notifications
        let notifications = this.getNotifications();
        let notif = notifications.find(n => n.id == notifId || n.timestamp == notifId);
        if (notif) {
            notif.read = true;
            this.saveNotifications(notifications);
            return true;
        }
        
        // Check system updates
        let updates = this.getSystemUpdates();
        let update = updates.find(u => u.id == notifId || u.timestamp == notifId);
        if (update) {
            update.read = true;
            this.saveSystemUpdates(updates);
            return true;
        }
        
        return false;
    },

    // ==========================================
    // EXPORT/IMPORT METHODS
    // ==========================================

    exportAllData() {
        const data = {
            alumni: this.getAlumni(),
            students: this.getStudents(),
            users: this.getUsers(),
            notifications: this.getNotifications(),
            systemUpdates: this.getSystemUpdates(),
            events: this.getEvents(),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `alumni_portal_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return data;
    },

    exportAlumni() {
        const data = this.getAlumni();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `alumni_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    exportStudents() {
        const data = this.getStudents();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.alumni) this.saveAlumni(data.alumni);
            if (data.students) this.saveStudents(data.students);
            if (data.users) this.saveUsers(data.users);
            if (data.notifications) this.saveNotifications(data.notifications);
            if (data.systemUpdates) this.saveSystemUpdates(data.systemUpdates);
            if (data.events) this.saveEvents(data.events);
            
            return { success: true, message: "Data imported successfully!" };
        } catch (error) {
            return { success: false, message: "Error importing data: " + error.message };
        }
    },

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    formatStrand(strand) {
        const strandMap = {
            'programming': 'TVL - Computer Programming',
            'fbs-cookery': 'TVL - FBS / Cookery',
            'animation': 'TVL - Animation',
            'beautycare': 'TVL - Beauty Care',
            'eim': 'TVL - EIM',
            'stem': 'STEM',
            'abm': 'ABM',
            'humss': 'HUMSS'
        };
        return strandMap[strand] || strand || 'N/A';
    },

    formatStatus(status) {
        const statusMap = {
            'currently-enrolled': 'Currently Enrolled in College',
            'completed-college': 'Completed College',
            'never-pursued': 'Never Pursued College'
        };
        return statusMap[status] || status || 'N/A';
    },

    generateId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    clearAllData() {
        if (confirm("WARNING: This will delete ALL data! Are you sure?")) {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            sessionStorage.removeItem('activeSession');
            return true;
        }
        return false;
    },

    getStats() {
        return {
            totalAlumni: this.getAlumni().length,
            totalStudents: this.getStudents().length,
            totalUsers: this.getUsers().length,
            totalNotifications: this.getNotifications().length,
            unreadNotifications: this.getNotifications().filter(n => !n.read).length
        };
    }
};

// Make available globally
window.DataManager = DataManager;