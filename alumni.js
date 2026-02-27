function saveAlumni() {
    const alumni = JSON.parse(localStorage.getItem("alumni")) || [];
  
    const record = {
      name: name.value,
      strand: strand.value,
      year: year.value,
      status: status.value
    };
  
    alumni.push(record);
    localStorage.setItem("alumni", JSON.stringify(alumni));
    localStorage.setItem("myProfile", JSON.stringify(record));
  
    location.href = "alumni-form.html";
  }