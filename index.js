import { education as schools } from "./education.js";
//MAPS API KEY: An2BID8gjDrD-UScA6QxwaY9_2tZ5UfaDZpzaMyH3ZP3MfvTfapUtsG-6EafTre3

/**
 * APP-LEVEL VARIABLES AND COMPONENTS
 */

let map;
let directionsManager;
let infobox;
let originObject;
let destinationObject;
let waypoint1;
let waypoint2;
let successAlert = document.querySelector("#successAlert");
let errorAlert = document.querySelector("#errorAlert");

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

const populateMapWith = schools => {
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

    Events.addHandler(pin, "click", pushpinClicked);
    map.entities.push(pin);
  });
};

const pinOwnPosition = position => {
  console.log(position.coords.latitude, position.coords.longitude);

  let location = new Location(
    position.coords.latitude,
    position.coords.longitude
  );

  originObject = { name: "My Location", location: location };

  let pin = new Pushpin(location, {
    subTitle: "I'm here"
  });

  pin.metadata = {
    description: `<div style="font-size: 1em; color: black; text-align: center; font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;">
                  <p><b>My Location</b></p>
                  <p><b>Latitude:</b> ${position.coords.latitude}, <b>Longitude:</b> ${position.coords.longitude}</p>
                  </div>`
  };
  Events.addHandler(pin, "click", pushpinClicked);
  map.entities.push(pin);
  map.setOptions({
    center: location
  });

  Events.invoke(pin, "click", pin);
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

/**
 * API SET UP
 */

/**
 * LOAD COMPONENTS AND SETUP PAGE/MAP
 */

let buttons = document
  .querySelector("#filterButtons")
  .querySelectorAll("button");

console.log(buttons);

buttons.forEach((button => {
  console.log(button);
  button.addEventListener("click", () => {
    //console.log(that);
    if (button.innerText == "All"){
      populateMapWith(schools);
    } else {
      populateMapWith(getSchoolsByCategory(button.innerText));
    }
  })
}));

loadMapScenario();

populateMapWith(schools);

getLocation();

// });
