import Collapse from 'js/bootstrap/src/collapse'

// Sets up a given map control
function setupMap(prefix, coords, address) {
  let map = L.map(`${prefix}-map`, { scrollWheelZoom: false });
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
  for (element of document.getElementById("maps").children) {
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
    if (calendar.ok) {
      calendar = await calendar.text();
      calendar = ICAL.parse(calendar);
      events = new ICAL.Component(calendar);
      return events.getAllSubcomponents("vevent");
    } else {
      throw new Error(`Error - couldn't retrieve ${filename} - not 2xx response`, { cause: calendar });
    }
  } catch (e) {
    console.log(e.message);
  }
}

// Iterates over the events from the calendar and returns the next upcoming or current event - we compare based on day only, not time
async function getNextEvent() {
  const now = ICAL.Time.now();
  // For testing purposes
  // const now = new ICAL.Time({
  //   year: 2025,
  //   month: 10,
  //   day: 10,
  //   hour: 0,
  //   minute: 0,
  //   isDate: false
  // });

  const events = await getEvents();
  const nextEvent = new ICAL.Event(events[0]);

  // Slightly confusing in that recurrence rules expand to ICAL.Time instances rather than ICAL.Event instances
  const recurringExpanded = new ICAL.RecurExpansion({
    component: events[0],
    dtstart: events[0].getFirstPropertyValue("dtstart")
  });

  // Iterate over the ICAL.Time instances while the date is still in the past
  let nextTime = recurringExpanded.next();

  while (nextTime && nextTime.compareDateOnlyTz(now, now.zone) === -1) {
    nextTime = recurringExpanded.next();
  }

  if (nextTime) {
    // Update our copied event with the correct start time, note the end date is incorrect but it doesn't matter because we don't use it
    nextEvent.startDate = nextTime;
    return nextEvent;
  } else {
    throw new Error("Error - couldn't find a current or upcoming event in the calendar.", { cause: events });
  }
}

// Populates the next meetup card with date and time
function populateNextMeet(event) {
  let date = event.startDate.toJSDate();
  let dateElement = document.getElementById("date");
  let timeElement = document.getElementById("time");

  dateElement.innerHTML = date.toLocaleString("en-gb", { weekday: "long", year: "numeric", month: "long", day: 'numeric' });
  timeElement.innerHTML = date.toLocaleString("en-gb", { hour: "numeric", minute: "numeric", hour12: true }).replace(" ", "");
  dateElement.classList.remove("placeholder");
  timeElement.classList.remove("placeholder");
}

// Reorders the map accordion such that the map for the current meetup event is moved to the top and shown
function reorderMaps(event) {
  let mapId = event.location.toLowerCase().replaceAll(" ", "-");

  try {
    let mapElement = document.getElementById(mapId);

    if (!mapElement) {
      throw new Error(`Error - couldn't find the element with id ${mapId} to re-order and show in the accordion maps control.`, { cause: mapId });
    }

    let mapContainer = mapElement.parentNode;

    if (mapElement !== mapContainer.firstChild) {
      mapContainer.removeChild(mapElement);
      mapContainer.insertBefore(mapElement, mapContainer.firstChild);
    }

    new Collapse(`#${mapId}-container`, { show: true });
  } catch (e) {
    console.log(e.message);
  }
}

// Do stuff when the page loads
window.addEventListener("load", async (e) => {
  setupMaps();
  const event = await getNextEvent();
  if (event) {
    populateNextMeet(event);
    reorderMaps(event);
  }
});
