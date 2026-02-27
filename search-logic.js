window.onload = function() {
    displayAlumni();
};

function displayAlumni() {
    const resultsGrid = document.getElementById('resultsGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const strandFilter = document.getElementById('strandFilter').value;
    const yearFilter = document.getElementById('yearFilter') ? document.getElementById('yearFilter').value : 'all';
    
    // Pull data from all possible keys
    const rawData = localStorage.getItem('registered_alumni') || 
                    localStorage.getItem('alumni') || 
                    localStorage.getItem('users');
    
    const allAlumni = JSON.parse(rawData) || [];

    resultsGrid.innerHTML = '';

    const filteredList = allAlumni.filter(person => {
        // SAFE NAME CHECK: Looks for any variation of 'name'
        const possibleName = person.name || person.fullname || person.fullName || "";
        const nameMatch = possibleName.toLowerCase().includes(searchTerm);
        
        // STRAND FILTER - exact match
        const personStrand = (person.strand || "").toLowerCase();
        const filterStrand = strandFilter.toLowerCase();
        const strandMatch = (strandFilter === "all") || (personStrand === filterStrand);
        
        // YEAR/BATCH FILTER - exact match
        const personYear = (person.batch || person.year || "").toString();
        const yearMatch = (yearFilter === "all") || (personYear === yearFilter);
        
        // Only return if ALL filters match
        return nameMatch && strandMatch && yearMatch;
    });

    if (filteredList.length === 0) {
        resultsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #8b9dc3; padding: 40px;">No alumni found matching your filters</p>`;
        return;
    }

    filteredList.forEach(alumni => {
        const card = document.createElement('div');
        card.className = 'alumni-result-card';
        // Use whichever name property exists
        const displayName = alumni.name || alumni.fullname || alumni.fullName || "Unknown Name";
        const alumniId = alumni.lrn || alumni.id;
        const displayStrand = formatStrand(alumni.strand);
        const displayYear = alumni.batch || alumni.year || 'N/A';
        
        // Check if alumni has profile image
        const avatarContent = alumni.profileImage 
            ? `<img src="${alumni.profileImage}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : `👤`;
        
        card.innerHTML = `
            <div class="result-avatar" style="overflow: hidden; background: ${alumni.profileImage ? 'transparent' : 'rgba(255,255,255,0.1)'};">
                ${avatarContent}
            </div>
            <div class="result-info">
                <h4>${displayName}</h4>
                <p class="result-strand">${displayStrand}</p>
                <p class="result-batch">Batch ${displayYear}</p>
            </div>
            <button class="view-btn" onclick="viewAlumniProfile('${alumniId}')">View Profile</button>
        `;
        resultsGrid.appendChild(card);
    });
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
    return strandMap[strand] || strand || 'No Strand';
}

function viewAlumniProfile(alumniId) {
    // Redirect to view profile page
    window.location.href = `view-profile.html?id=${alumniId}`;
}

function goBackToDashboard() {
    // Get the logged-in user info
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Check if they are Alumni or Student
    if (currentUser && currentUser.role === "alumni") {
        window.location.href = 'searchh.html'; // Your Alumni Dashboard
    } else {
        window.location.href = 'search.html';  // Your Student Dashboard
    }
}