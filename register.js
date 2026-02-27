document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevents the page from just refreshing

    // 1. Get the values from the inputs
    const name = document.getElementById('fullName').value;
    const strand = document.getElementById('strand').value;
    const batch = document.getElementById('batch').value;

    // 2. Create the alumni object
    const newAlumni = {
        id: Date.now(),
        name: name,
        strand: strand,
        batch: batch
    };

    // 3. Get existing alumni from storage, or start a new list
    let alumniList = JSON.parse(localStorage.getItem('registered_alumni')) || [];

    // 4. Add the new person to the list
    alumniList.push(newAlumni);

    // 5. Save back to localStorage
    localStorage.setItem('registered_alumni', JSON.stringify(alumniList));

    alert("Registration Successful!");
    
    // 6. Redirect to the search page so you can see yourself!
    window.location.href = 'find-alumni.html';
});