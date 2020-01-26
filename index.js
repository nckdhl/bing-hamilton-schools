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

/**
 * FUNCTION DEFINITIONS
 */


// Destructure Microsoft.Maps library object to shorten library calls
const { Pushpin, Map, Events, Location } = Microsoft.Maps;

/**
 * Main map load function
 */
const loadMapScenario = () => {
  let hamilton = new Location(43.25011, -79.84963);
  map = new Map(document.getElementById("myMap"), {
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

/**
 * Filters schools by category when passed a string
 * that matches the school.CATEGORY property
 * 
 * @param {any of below strings} category 
 */// "Section 23 Program" "Secondary School" "Elementary School" "Post Secondary"
  // "Alternative Education" "Adult Learning" "Middle School"
const getSchoolsByCategory = category => {
  return schools.filter(school => school.CATEGORY === category);
};

/**
 * Populates directions panel with directions
 */
const populateDirections = () => {
  
  if (directionsManager) {
    directionsManager.clearDisplay();
    directionsManager.clearAll();
  }

  // Additional Directions library loaded async
  Microsoft.Maps.loadModule("Microsoft.Maps.Directions", async function() {
    console.log("Module loaded!");
    directionsManager = await new Microsoft.Maps.Directions.DirectionsManager(
      map
    );
    
    // Your location waypoint
    waypoint1 = await new Microsoft.Maps.Directions.Waypoint({
      address: originObject.name,
      location: originObject.location
    });

    // Pushpin destination waypoint
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

    // This events handler is fired when "directionsError" naturally occurs
    // or when invoked manually by a school filter button click, or new directions call
    Events.addHandler(directionsManager, "directionsError", function() {
      window.setTimeout(function() {
        directionsManager.clearAll();
        document.getElementById("printoutPanel").innerHTML =
          "Directions cleared (Waypoints cleared, map/itinerary cleared, request and render options reset to default values)";
      }, 500);
    });
  });
};

/**
 * Fires when a pushpin is clicked
 * and opens up an infobox above the pushpin 
 * with that pushpin's data as well 
 * as a "directions" anchor tag that
 * when clicked calculates directions to that pin
 * @param {Event} e 
 */
const pushpinClicked = e => {
  console.log(e);
  console.log("Push pin clicked");

  /**
   * Helper function that sets the content 
   * of the infobox
   * @param {Location} location 
   * @param {string} title 
   * @param {string} description 
   */
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

  /**
   * Helper function that creates 
   * object that contains the destination props
   * @param {string} name 
   * @param {Location} location 
   */
  function makeDestinationObject(name, location) {
    return { name: name, location: location };
  }

  //Make sure the infobox has metadata to display
  // and check whether the event is coming from a click
  // or from a manual invocation of the event 
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
  
  }
};

/**
 * Populates map with school pins and user location pin.
 * Takes in an array of school objects and uses object 
 * properties to set pushpin data
 * @param {school[]} schools 
 */
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

/**
 * Callback for user geolocation query
 * Sets location of user to pushpin 
 * and populates map with that pushpin 
 * as well as all the schools pushpins
 * 
 * Only called on initial page load
 * @param {Position} position 
 */
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

/**
 * Error callback in case the user
 * refuses the location request
 * @param {error} error 
 */
const showPermissionError = error => {
  console.log(error);
  errorAlert.setAttribute("class", "alert alert-danger");
  errorAlert.innerHTML += `<p>${error.message}</p>`;
};

/**
 * Invokes the geolocation request
 */
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

/**
 * Wrapper function that ensures that the SearchManager
 * library is loaded
 * @param {string} name 
 * @param {string} address 
 */
function Search(name, address) {
  if (!searchManager) {
    //Create an instance of the search manager and perform the search.
    Microsoft.Maps.loadModule("Microsoft.Maps.Search", function() {
      searchManager = new Microsoft.Maps.Search.SearchManager(map);
      Search();
    });
  } else {
    geocodeQuery(name, address);
  }
}

/**
 * Packages the name and address
 * as an object to pass to the
 * SearchManager geocode request
 * @param {string} name 
 * @param {string} address 
 */
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
 * LOAD COMPONENTS AND SETUP PAGE/MAP, BUTTON EVENTS
 */

let filterButtons = document
  .querySelector("#filterButtons")
  .querySelectorAll("button");

let clearDirectionsButton = document.querySelector("#clearDirections");

/**
 * Manuall invokes the "directionsError" which clears the directions
 */
clearDirectionsButton.addEventListener("click", () => {
  Events.invoke(directionsManager, "directionsError");
});

/**
 * When the filter buttons are clicked the button text value
 * is used to filter the schools array and populate the map with
 * the remaining schools
 */
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

/**
 * When pin name and address form are
 * submitted then a geocode request is made
 */
submit.addEventListener("click", event => {
  event.preventDefault();
  let name = nameInput.value;
  let address = addressInput.value;

  Search(name, address);
});

// LOAD MAP
loadMapScenario();

// GET USER LOCATION
getLocation();


