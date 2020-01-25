import { education as schools } from "./education.js";
//MAPS API KEY: An2BID8gjDrD-UScA6QxwaY9_2tZ5UfaDZpzaMyH3ZP3MfvTfapUtsG-6EafTre3

/**
 * APP-LEVEL VARIABLES AND COMPONENTS
 */

let map;
let directionsManager;
let searchManager;
let infobox;
let myLocationPin;
let originObject;
let destinationObject;
let waypoint1;
let waypoint2;
let successAlert = document.querySelector("#successAlert");
let errorAlert = document.querySelector("#errorAlert");

let that = this;
/**
 * FUNCTION DEFINITIONS
 */

const { Pushpin, Map, Events, Location } = Microsoft.Maps;

const loadMapScenario = () => {
  let hamilton = new Location(43.25011, -79.84963);
  map = new Map(document.getElementById("myMap"), {
    /* No need to set credentials if already passed in URL */
    center: hamilton,
    zoom: 11
  });
  console.log(map);

  infobox = new Microsoft.Maps.Infobox(hamilton, {
    visible: false
  });

  infobox.setOptions({});

  infobox.setMap(map);
};

// "Section 23 Program" "Secondary School" "Elementary School" "Post Secondary"
// "Alternative Education" "Adult Learning" "Middle School"
const getSchoolsByCategory = category => {
  return schools.filter(school => school.CATEGORY === category);
};

const populateDirections = () => {
  console.log("ORIGIN", originObject);
  console.log("DESTINATION", destinationObject);

  if (directionsManager) {
    directionsManager.clearDisplay();
    directionsManager.clearAll();
    console.log("Tried to clear");
  }

  Microsoft.Maps.loadModule("Microsoft.Maps.Directions", async function() {
    console.log("Module loaded!");
    directionsManager = await new Microsoft.Maps.Directions.DirectionsManager(
      map
    );

    waypoint1 = await new Microsoft.Maps.Directions.Waypoint({
      address: originObject.name,
      location: originObject.location
    });

    waypoint2 = await new Microsoft.Maps.Directions.Waypoint({
      address: destinationObject.name,
      location: destinationObject.location
    });

    await directionsManager.setRequestOptions({
      routeMode: Microsoft.Maps.Directions.RouteMode.driving
    });

    await directionsManager.addWaypoint(waypoint1);
    await directionsManager.addWaypoint(waypoint2);

    await directionsManager.setRenderOptions({
      itineraryContainer: document.getElementById("printoutPanel")
    });

    await directionsManager.calculateDirections();

    Events.addHandler(directionsManager, "directionsError", function() {
      window.setTimeout(function() {
        directionsManager.clearAll();
        document.getElementById("printoutPanel").innerHTML =
          "Directions cleared (Waypoints cleared, map/itinerary cleared, request and render options reset to default values)";
      }, 500);
    });
  });
};

const pushpinClicked = e => {
  console.log(e);
  console.log("Push pin clicked");

  function setOptions(location, title, description) {
    infobox.setOptions({
      location: location,
      title: title,
      description: description,
      maxHeight: 150,
      maxWidth: 400,
      visible: true,
      actions: [
        {
          label: "Directions",
          eventHandler: populateDirections
        }
      ]
    });
  }

  function makeDestinationObject(name, location) {
    return { name: name, location: location };
  }

  //Make sure the infobox has metadata to display.
  if (e.metadata || e.target.metadata) {
    if (e.eventName) {
      let location = e.target.getLocation();
      const { title, description } = e.target.metadata;
      setOptions(location, title, description);
      destinationObject = makeDestinationObject(title, location);
    } else {
      let location = e.getLocation();
      const { title, description } = e.metadata;
      setOptions(location, title, description);
      destinationObject = makeDestinationObject(title, location);
    }
    console.log("HAS METADATA");
  }
};

const populateMap = schools => {
  map.entities.clear();
  schools.map(school => {
    let location = new Location(school.LATITUDE, school.LONGITUDE);

    let schoolProps = `
      <div style="font-size: 1em; color: black; text-align: left; font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif; overflow-y: scroll;">
        <p><b>Name:</b>
        <a href="${school.WEBSITE}">${school.NAME}</a>
        </p>
        <p><b>Address:</b> ${school.ADDRESS} </p>
        <p><b>Category:</b> ${school.CATEGORY} </p>
        <p><b>Community:</b> ${school.COMMUNITY} </p>
        <p style="text-align: center; font-size: 1.3em;">
        </p>
      </div>
      `;

    let pin = new Pushpin(location);
    pin.metadata = {
      title: school.NAME,
      description: schoolProps
    };

    // let myPin = new Pushpin(location);

    Events.addHandler(pin, "click", pushpinClicked);
    map.entities.push(pin);
  });

  console.log("My Location Pin", myLocationPin);

  map.entities.push(myLocationPin);
};

const pinOwnPosition = position => {
  console.log(position.coords.latitude, position.coords.longitude);

  let location = new Location(
    position.coords.latitude,
    position.coords.longitude
  );

  originObject = { name: "My Location", location: location };

  myLocationPin = new Pushpin(location, {
    title: "My Location"
  });

  myLocationPin.metadata = {
    description: `<div style="font-size: 1em; color: black; text-align: center; font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;">
                  <p><b>My Location</b></p>
                  <p><b>Latitude:</b> ${position.coords.latitude}, <b>Longitude:</b> ${position.coords.longitude}</p>
                  </div>`
  };
  Events.addHandler(myLocationPin, "click", pushpinClicked);
  map.setOptions({
    center: location
  });

  Events.invoke(myLocationPin, "click", myLocationPin);

  populateMap(schools);
};

const showPermissionError = error => {
  console.log(error);
  errorAlert.setAttribute("class", "alert alert-danger");
  errorAlert.innerHTML += `<p>${error.message}</p>`;
};

const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pinOwnPosition,
      showPermissionError
    );
  } else {
    errorAlert.setAttribute("class", "alert alert-danger");
    errorAlert.innerHTML = "Geolocation is not supported by this browser.";
  }
};

function Search(name, address) {
  if (!searchManager) {
    //Create an instance of the search manager and perform the search.
    Microsoft.Maps.loadModule("Microsoft.Maps.Search", function() {
      searchManager = new Microsoft.Maps.Search.SearchManager(map);
      Search();
    });
  } else {
    //Remove any previous results from the map.
    map.entities.clear();
    geocodeQuery(name, address);
  }
}

function geocodeQuery(name, address) {
  function resultsCallback(r) {
    if (r && r.results && r.results.length > 0) {
      var pin = new Microsoft.Maps.Pushpin(r.results[0].location, {
        title: name
      });
      map.entities.push(pin);

      map.setView({ bounds: r.results[0].bestView });
    }
  }

  var searchRequest = {
    where: address,
    callback: resultsCallback,
    errorCallback: function(e) {
      //If there is an error, alert the user about it.
      alert("No results found.");
    }
  };

  //Make the geocode request.
  searchManager.geocode(searchRequest);
}

/**
 * API SET UP
 */

/**
 * LOAD COMPONENTS AND SETUP PAGE/MAP
 */

let filterButtons = document
  .querySelector("#filterButtons")
  .querySelectorAll("button");

let clearDirectionsButton = document.querySelector("#clearDirections");

clearDirectionsButton.addEventListener("click", () => {
  Events.invoke(directionsManager, "directionsError");
});

filterButtons.forEach(button => {
  console.log(button);
  button.addEventListener("click", () => {
    if (button.innerText == "All") {
      populateMap(schools);
    } else {
      populateMap(getSchoolsByCategory(button.innerText));
    }
    infobox.setOptions({ visible: false });
    Events.invoke(directionsManager, "directionsError");
  });
});

let nameInput = document.querySelector("#name");
let addressInput = document.querySelector("#address");
let form = document.querySelector("form");
let submit = form.querySelector("button");

submit.addEventListener("click", event => {
  event.preventDefault();
  let name = nameInput.value;
  let address = addressInput.value;

  Search(name, address);
});

loadMapScenario();

getLocation();

// });
