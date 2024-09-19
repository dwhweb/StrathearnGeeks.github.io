import Collapse from 'js/bootstrap/src/collapse'

// Sets up a given map control
function setupMap(prefix, coords, address) {
  let map = L.map(`${prefix}-map`, {scrollWheelZoom: false});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
  }).addTo(map);
  let addressMarker = L.marker(coords).addTo(map).bindPopup(address);

  // Required so that the view is centred and the address marker pops up when the accordion control is shown/clicked
  document.getElementById(`${prefix}-container`).addEventListener("shown.bs.collapse", () => {
    map.setView(coords, 18);
    addressMarker.openPopup();
  });
}

// Populates the map accordion controls
function setupMaps() {
  // Iterate over the accordion element children, pull out the relevant data attributes and set up the map for each child container
  for(element of document.getElementById("maps").children) {
    let prefix = element.dataset.location.toLowerCase().replaceAll(" ", "-");
    let coords = JSON.parse(element.dataset.coords);
    let addressElement = document.createElement("p");
    addressElement.innerHTML = element.dataset.address.slice(1, -1).replace(/\\n/g, "<br>"); // Remove surrounding quotes and replace newlines
    setupMap(prefix, coords, addressElement);
  }
}

// Gets the events via fetch and returns them
async function getEvents() {
  let filename = "strath_geeks_cal.ics"

  try {
    let calendar = await fetch(filename);
    if(calendar.ok) {
      calendar = await calendar.text();
      calendar = ICAL.parse(calendar);
      events = new ICAL.Component(calendar);
      return events.getAllSubcomponents("vevent");
    } else {
      throw new Error(`Error - couldn't retrieve ${filename} - not 2xx response`, {cause: calendar});
    }
  } catch(e) {
    console.log(e.message);
  }
}

// Iterates over the events from the calendar and returns the next upcoming or current event - we compare based on day only, not time
// Note this function isn't particulary portable and will break on a different calendar structure than the current one with two recurring events
async function getNextEvent() {
  // For testing purposes
  // let now = new ICAL.Time({
  //   year: 2025,
  //   month: 8,
  //   day: 1,
  //   hour: 0,
  //   minute: 0,
  //   isDate: false
  // });

  let now = ICAL.Time.now();
  let events = await getEvents();

  // Slightly confusing in that recurrence rules expand to ICAL.Time instances rather than ICAL.Event instances
  let expandFirst = new ICAL.RecurExpansion({
    component: events[0],
    dtstart: events[0].getFirstPropertyValue("dtstart")
  });

  let expandSecond = new ICAL.RecurExpansion({
    component: events[1],
    dtstart: events[1].getFirstPropertyValue("dtstart")
  });

  let startTime = expandFirst.next()
  let firstAssignedLast = true;
  let event = null;

  // Iterate in an alternating fashion over expandFirst and expandSecond while the event start time is < the current time
  while(startTime && startTime.compareDateOnlyTz(now, now.zone) === -1) {
    if(firstAssignedLast) {
      startTime = expandSecond.next();
      firstAssignedLast = false;
    } else {
      startTime = expandFirst.next();
      firstAssignedLast = true;
    }
  }

  if(startTime) {
    // If we found that the next current event date came from the first event, copy it so we have the correct venue
    if(firstAssignedLast) {
      event = new ICAL.Event(events[0]);
    } else {
      event = new ICAL.Event(events[1]);
    }

    // Update our copied event with the correct start time, note the end date is incorrect but it doesn't matter because we don't use it
    event.startDate = startTime; 
    return event;
  } else {
    throw new Error("Error - couldn't find a current or upcoming event in the calendar.", {cause: events});
  }
}

// Populates the next meetup card with date, time and location
function populateNextMeet(event) {
  let date = event.startDate.toJSDate();
  let dateElement = document.getElementById("date");
  let timeElement = document.getElementById("time");
  let locationElement = document.getElementById("location");

  dateElement.innerHTML = date.toLocaleString("en-gb", {weekday: "long", year: "numeric", month: "long", day: 'numeric'});
  timeElement.innerHTML = date.toLocaleString("en-gb", {hour: "numeric", minute: "numeric", hour12: true}).replace(" ", "");
  locationElement.innerHTML = `${event.location}.`;
  dateElement.classList.remove("placeholder");
  timeElement.classList.remove("placeholder");
  locationElement.classList.remove("placeholder");
}

// Reorders the map accordion such that the map for the current meetup event is moved to the top and shown
function reorderMaps(event) {
  let mapId = event.location.toLowerCase().replaceAll(" ", "-");

  try {
    let mapElement = document.getElementById(mapId);
    
    if(!mapElement) {
      throw new Error(`Error - couldn't find the element with id ${mapId} to re-order and show in the accordion maps control.`, {cause: mapId});
    }

    let mapContainer = mapElement.parentNode;

    if(mapElement !== mapContainer.firstChild) {
      mapContainer.removeChild(mapElement);
      mapContainer.insertBefore(mapElement, mapContainer.firstChild);
    }

    new Collapse(`#${mapId}-container`, {show: true}); 
  } catch(e) {
    console.log(e.message);
  }
}

// Do stuff when the page loads
window.addEventListener("load", async (e) => {
  setupMaps();
  let event = await getNextEvent();
  if(event) {
    populateNextMeet(event);
    reorderMaps(event);
  }
});
