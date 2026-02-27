function toggleFields() {
  const role = document.getElementById("role").value;
  const studentFields = document.getElementById("studentFields");
  const alumniFields = document.getElementById("alumniFields");
  
  if (role === "alumni") {
    studentFields.style.display = "none";
    alumniFields.style.display = "block";
  } else {
    studentFields.style.display = "block";
    alumniFields.style.display = "none";
  }
}

function toggleCourseField() {
  const status = document.getElementById("currentStatus").value;
  const courseField = document.getElementById("courseField");
  
  if (status === "never-pursued") {
    courseField.style.display = "none";
    document.getElementById("courseTaken").value = "N/A";
  } else {
    courseField.style.display = "block";
  }
}

function register() {
  const role = document.getElementById("role").value;
  const email = document.getElementById("email").value;
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;

  if (!email || !username || !password) {
    alert("Please fill in all required fields (Email, Username, Password)");
    return;
  }

  let userData = {
    role: role,
    email: email,
    username: username,
    password: password
  };

  if (role === "student") {
    const fullname = document.getElementById("studentFullname").value;
    const lrn = document.getElementById("studentLrn").value;
    const strand = document.getElementById("studentStrand").value;

    if (!fullname || !lrn || !strand) {
      alert("Please fill in all student information");
      return;
    }

    userData = {
      ...userData,
      fullname: fullname,
      lrn: lrn,
      strand: strand,
      type: "student"
    };

    const students = JSON.parse(localStorage.getItem("students")) || [];
    students.push({
      name: fullname,
      lrn: lrn,
      strand: strand,
      email: email,
      username: username
    });
    localStorage.setItem("students", JSON.stringify(students));

  } else if (role === "alumni") {
    const lastName = document.getElementById("lastName").value;
    const firstName = document.getElementById("firstName").value;
    const middleName = document.getElementById("middleName").value;
    const age = document.getElementById("age").value;
    const sexElement = document.querySelector('input[name="sex"]:checked');
    const sex = sexElement ? sexElement.value : "N/A";
    const lrn = document.getElementById("alumniLrn").value;
    const strand = document.getElementById("alumniStrand").value;
    const yearGraduated = document.getElementById("yearGraduated").value;
    const currentStatus = document.getElementById("currentStatus").value;
    const courseTaken = document.getElementById("courseTaken").value;
    const alignedElement = document.querySelector('input[name="aligned"]:checked');
    const aligned = alignedElement ? alignedElement.value : "N/A";

    if (!lastName || !firstName || !age || !lrn || !strand || !yearGraduated || !currentStatus) {
      alert("Please fill in all required alumni information");
      return;
    }

    const fullName = `${lastName}, ${firstName} ${middleName}`.trim();

    const alumniRecord = {
      id: Date.now(),
      name: fullName,
      strand: strand,
      batch: yearGraduated,
      lastName: lastName,
      firstName: firstName,
      middleName: middleName,
      age: age,
      sex: sex,
      lrn: lrn,
      email: email,
      currentStatus: currentStatus,
      courseTaken: courseTaken || "N/A",
      aligned: aligned
    };

    let alumniList = JSON.parse(localStorage.getItem("registered_alumni")) || [];
    alumniList.push(alumniRecord);
    localStorage.setItem("registered_alumni", JSON.stringify(alumniList));
    localStorage.setItem("alumni", JSON.stringify(alumniList));

    userData = { ...userData, ...alumniRecord, type: "alumni" };
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  users.push(userData);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful! Please login.");
  location.href = "login.html";
}

// Generate unique session ID for this tab
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  if (username === "admin" && password === "admin123") {
    location.href = "admin.html";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Create unique session for this tab
    const sessionId = generateSessionId();
    const sessionData = {
      ...user,
      sessionId: sessionId,
      loginTime: new Date().toISOString()
    };
    
    // Save to both localStorage (for persistence) and sessionStorage (for this tab only)
    localStorage.setItem("currentUser", JSON.stringify(sessionData));
    sessionStorage.setItem("activeSession", JSON.stringify(sessionData));
    
    // Redirecting based on role
    if (user.role === "alumni") {
      location.href = "searchh.html";
    } else {
      location.href = "search.html";
    }
  } else {
    alert("Invalid username or password");
  }
}

// Function to get current user for this specific tab
function getCurrentUser() {
  // First check sessionStorage (tab-specific)
  const sessionData = sessionStorage.getItem("activeSession");
  if (sessionData) {
    return JSON.parse(sessionData);
  }
  
  // Fallback to localStorage if session not found
  const localData = localStorage.getItem("currentUser");
  if (localData) {
    const user = JSON.parse(localData);
    // Restore session for this tab
    sessionStorage.setItem("activeSession", localData);
    return user;
  }
  
  return null;
}