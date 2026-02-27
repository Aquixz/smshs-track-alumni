function saveEvent() {
    localStorage.setItem("event", event.value);
    load();
  }
  
  function load() {
    events.innerText = localStorage.getItem("event") || "";
  }
  
  load();