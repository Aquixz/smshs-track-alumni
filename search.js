function search() {
    const key = filter.value.toLowerCase();
    const alumni = JSON.parse(localStorage.getItem("alumni")) || [];
    results.innerHTML = "";
  
    alumni.filter(a =>
      a.strand.toLowerCase().includes(key) ||
      a.year.includes(key)
    ).forEach(a => {
      results.innerHTML += <li>${a.name} - ${a.strand} - ${a.year}</li>;
    });
  }