// Load current user data
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
let allAlumni = JSON.parse(localStorage.getItem("alumni")) || [];
let allUsers = JSON.parse(localStorage.getItem("users")) || [];

// Find user's alumni record
let alumniIndex = allAlumni.findIndex(a => a.lrn === currentUser.lrn);

function loadProfile() {
  // Refresh data from localStorage to get latest including image
  allAlumni = JSON.parse(localStorage.getItem("alumni")) || [];
  currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  alumniIndex = allAlumni.findIndex(a => a.lrn === currentUser.lrn);
  
  // If user has alumni record, use that, otherwise use currentUser
  const data = alumniIndex !== -1 ? allAlumni[alumniIndex] : currentUser;
  
  // Load profile image if exists
  loadProfileImage(data.profileImage);
  
  // View Mode - Update ALL fields
  document.getElementById("displayName").textContent = data.name || "Unknown";
  document.getElementById("viewName").textContent = data.name || "-";
  document.getElementById("viewAge").textContent = data.age || "-";
  document.getElementById("viewSex").textContent = data.sex || "-";
  document.getElementById("viewLrn").textContent = data.lrn || "-";
  document.getElementById("viewEmail").textContent = data.email || "-";
  document.getElementById("viewStrand").textContent = formatStrand(data.strand) || "-";
  document.getElementById("viewYear").textContent = data.year || "-";
  document.getElementById("viewStatus").textContent = formatStatus(data.currentStatus) || "-";
  document.getElementById("viewCourse").textContent = data.courseTaken || "-";
  document.getElementById("viewAligned").textContent = data.aligned || "-";
  
  // Edit Mode - populate fields
  const nameParts = data.name ? data.name.split(', ') : ['', ''];
  const lastName = nameParts[0] || '';
  const firstMiddle = nameParts[1] ? nameParts[1].split(' ') : ['', ''];
  const firstName = firstMiddle[0] || '';
  const middleName = firstMiddle.slice(1).join(' ') || '';

  document.getElementById("editLastName").value = data.lastName || lastName;
  document.getElementById("editFirstName").value = data.firstName || firstName;
  document.getElementById("editMiddleName").value = data.middleName || middleName;
  document.getElementById("editAge").value = data.age || "";
  
  const sexRadio = document.querySelector(`input[name="editSex"][value="${data.sex}"]`);
  if (sexRadio) sexRadio.checked = true;
  
  document.getElementById("editLrn").value = data.lrn || "";
  document.getElementById("editEmail").value = data.email || "";
  document.getElementById("editStrand").value = data.strand || "";
  document.getElementById("editYear").value = data.year || "2024";
  document.getElementById("editStatus").value = data.currentStatus || "currently-enrolled";
  document.getElementById("editCourse").value = data.courseTaken || "";
  
  const alignedRadio = document.querySelector(`input[name="editAligned"][value="${data.aligned}"]`);
  if (alignedRadio) alignedRadio.checked = true;
  
  toggleEditCourse();
}

function loadProfileImage(imageData) {
  const avatarDisplay = document.getElementById("avatarDisplay");
  const profileImage = document.getElementById("profileImage");
  
  if (imageData) {
    // Show uploaded image
    profileImage.src = imageData;
    profileImage.style.display = "block";
    avatarDisplay.style.display = "none";
  } else {
    // Show default avatar
    profileImage.style.display = "none";
    avatarDisplay.style.display = "flex";
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert("Please select an image file");
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("Image size should be less than 5MB");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const imageData = e.target.result;
    
    // Display image immediately
    loadProfileImage(imageData);
    
    // Save to localStorage
    saveProfileImage(imageData);
    
    // Create notification for profile picture update
    createImageUpdateNotification();
  };
  reader.readAsDataURL(file);
}

function saveProfileImage(imageData) {
  // Update current user
  currentUser.profileImage = imageData;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  
  // Update in alumni list
  if (alumniIndex !== -1) {
    allAlumni[alumniIndex].profileImage = imageData;
    localStorage.setItem("alumni", JSON.stringify(allAlumni));
    localStorage.setItem("registered_alumni", JSON.stringify(allAlumni));
  }
  
  // Update in users list
  const userIndex = allUsers.findIndex(u => u.username === currentUser.username);
  if (userIndex !== -1) {
    allUsers[userIndex].profileImage = imageData;
    localStorage.setItem("users", JSON.stringify(allUsers));
  }
}

function createImageUpdateNotification() {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  
  const notification = {
    id: Date.now(),
    type: "profile_image_update",
    alumniName: currentUser.name,
    alumniId: currentUser.lrn,
    changes: ["profile picture"],
    message: `${currentUser.name} updated their profile picture.`,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  notifications.unshift(notification);
  localStorage.setItem("notifications", JSON.stringify(notifications));
  
  // Also create system update
  createSystemUpdate(notification);
}

function formatStrand(strand) {
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
  return strandMap[strand] || strand;
}

function formatStatus(status) {
  const statusMap = {
    'currently-enrolled': 'Currently Enrolled in College',
    'completed-college': 'Completed College',
    'never-pursued': 'Never Pursued College'
  };
  return statusMap[status] || status;
}

function enableEdit() {
  document.getElementById("viewMode").style.display = "none";
  document.getElementById("editMode").style.display = "block";
}

function cancelEdit() {
  document.getElementById("editMode").style.display = "none";
  document.getElementById("viewMode").style.display = "block";
  loadProfile();
}

function toggleEditCourse() {
  const status = document.getElementById("editStatus").value;
  const courseField = document.getElementById("editCourseField");
  
  if (status === "never-pursued") {
    courseField.style.display = "none";
    document.getElementById("editCourse").value = "N/A";
  } else {
    courseField.style.display = "block";
  }
}

// Function to create notification when profile is updated
function createUpdateNotification(oldData, newData) {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  
  // Determine what changed
  let changes = [];
  let changeMessages = [];
  
  if (oldData.name !== newData.name) {
    changes.push("name");
    changeMessages.push("name");
  }
  if (oldData.currentStatus !== newData.currentStatus) {
    changes.push("employment status");
    changeMessages.push(`employment status to "${formatStatus(newData.currentStatus)}"`);
  }
  if (oldData.courseTaken !== newData.courseTaken) {
    changes.push("course information");
    changeMessages.push(`course to "${newData.courseTaken}"`);
  }
  if (oldData.email !== newData.email) {
    changes.push("contact information");
    changeMessages.push("contact information");
  }
  if (oldData.age !== newData.age) {
    changes.push("age");
    changeMessages.push(`age to ${newData.age}`);
  }
  if (oldData.strand !== newData.strand) {
    changes.push("strand");
    changeMessages.push(`strand to "${formatStrand(newData.strand)}"`);
  }
  if (oldData.year !== newData.year) {
    changes.push("graduation year");
    changeMessages.push(`graduation year to ${newData.year}`);
  }
  if (oldData.aligned !== newData.aligned) {
    changes.push("course alignment");
    changeMessages.push(`course alignment to "${newData.aligned}"`);
  }
  
  if (changes.length === 0) return; // No significant changes
  
  // Create detailed message based on what changed
  let message;
  if (changeMessages.length === 1) {
    message = `${newData.name} updated their ${changeMessages[0]}.`;
  } else if (changeMessages.length === 2) {
    message = `${newData.name} updated their ${changeMessages[0]} and ${changeMessages[1]}.`;
  } else {
    message = `${newData.name} updated their profile information (${changeMessages.length} changes).`;
  }
  
  const notification = {
    id: Date.now(),
    type: "profile_update",
    alumniName: newData.name,
    alumniId: newData.lrn,
    changes: changes,
    changeDetails: changeMessages,
    message: message,
    timestamp: new Date().toISOString(),
    read: false,
    updatedFields: {
      name: newData.name,
      status: newData.currentStatus,
      course: newData.courseTaken,
      email: newData.email,
      age: newData.age,
      strand: newData.strand,
      year: newData.year,
      aligned: newData.aligned
    }
  };
  
  notifications.unshift(notification); // Add to beginning
  localStorage.setItem("notifications", JSON.stringify(notifications));
  
  // Also create a system update for the updates page
  createSystemUpdate(notification);
}

// Function to create system update (for updates/notification page)
function createSystemUpdate(notification) {
  const updates = JSON.parse(localStorage.getItem("systemUpdates")) || [];
  
  const update = {
    id: notification.id,
    type: "alumni_update",
    title: "Profile Update",
    message: notification.message,
    alumniName: notification.alumniName,
    alumniId: notification.alumniId,
    timestamp: notification.timestamp,
    read: false,
    details: notification.changeDetails || [notification.changes]
  };
  
  updates.unshift(update);
  localStorage.setItem("systemUpdates", JSON.stringify(updates));
}

function saveProfile() {
  const lastName = document.getElementById("editLastName").value;
  const firstName = document.getElementById("editFirstName").value;
  const middleName = document.getElementById("editMiddleName").value;
  const fullName = `${lastName}, ${firstName} ${middleName}`.trim();
  
  // Get old data for comparison
  const oldData = alumniIndex !== -1 ? allAlumni[alumniIndex] : currentUser;
  
  const newData = {
    name: fullName,
    lastName: lastName,
    firstName: firstName,
    middleName: middleName,
    age: document.getElementById("editAge").value,
    sex: document.querySelector('input[name="editSex"]:checked').value,
    lrn: document.getElementById("editLrn").value,
    email: document.getElementById("editEmail").value,
    strand: document.getElementById("editStrand").value,
    year: document.getElementById("editYear").value,
    currentStatus: document.getElementById("editStatus").value,
    courseTaken: document.getElementById("editCourse").value || "N/A",
    aligned: document.querySelector('input[name="editAligned"]:checked').value,
    role: "alumni",
    username: currentUser.username,
    password: currentUser.password,
    profileImage: currentUser.profileImage || null // Preserve profile image
  };

  // Validation
  if (!lastName || !firstName || !newData.age || !newData.lrn || !newData.strand || !newData.year) {
    alert("Please fill in all required fields");
    return;
  }

  // Create notification about the update
  createUpdateNotification(oldData, newData);

  // Update alumni list
  if (alumniIndex !== -1) {
    allAlumni[alumniIndex] = newData;
  } else {
    allAlumni.push(newData);
    alumniIndex = allAlumni.length - 1;
  }
  localStorage.setItem("alumni", JSON.stringify(allAlumni));
  
  // Also update registered_alumni for consistency
  localStorage.setItem("registered_alumni", JSON.stringify(allAlumni));

  // Update users list
  const userIndex = allUsers.findIndex(u => u.username === currentUser.username);
  if (userIndex !== -1) {
    allUsers[userIndex] = { ...allUsers[userIndex], ...newData };
    localStorage.setItem("users", JSON.stringify(allUsers));
  }

  // Update current user session
  currentUser = { ...currentUser, ...newData };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  alert("Profile updated successfully!");
  cancelEdit();
  loadProfile();
}

// Initialize
loadProfile();