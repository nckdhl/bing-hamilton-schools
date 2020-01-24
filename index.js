import { education as schools } from "./education.js";
//MAPS API KEY: An2BID8gjDrD-UScA6QxwaY9_2tZ5UfaDZpzaMyH3ZP3MfvTfapUtsG-6EafTre3

window.addEventListener("load", () => {
  /**
   * APP-LEVEL VARIABLES AND COMPONENTS
   */

  let map;
  let infobox;

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

  const pushpinClicked = e => {
    console.log("Push pin clicked");
    //Make sure the infobox has metadata to display.
    if (e.target.metadata) {
      //Set the infobox options with the metadata of the pushpin.
      infobox.setOptions({
        location: e.target.getLocation(),
        title: e.target.metadata.title,
        description: e.target.metadata.description,
        maxHeight: 250,
        maxWidth: 300,
        visible: true
      });
    }
  };

  const populateMapWith = schools => {
    schools.map(school => {
      let location = new Location(school.LATITUDE, school.LONGITUDE);

      let schoolProps = `
      <div style="font-size: 1em; color: black; text-align: left; font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;">
        <p><b>Name:</b> 
        <a href="${school.WEBSITE}">${school.NAME}</a> 
        </p>
        <p><b>Address:</b> ${school.ADDRESS} </p>
        <p><b>Category:</b> ${school.CATEGORY} </p>
        <p><b>Community:</b> ${school.COMMUNITY} </p>
        <p style="text-align: center; font-size: 1.3em;">
          <a href="#" onclick="populateDirections(${location})"><b>DIRECTIONS</b></a>
        </p>
      </div>
      `;

      let pin = new Pushpin(location);
      pin.metadata = {
        title: school.Name,
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
    let pin = new Pushpin(location, {
      subTitle: "I'm here"
    });

    pin.metadata = {
      title: "My location",
      description: `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`
    };
    Events.addHandler(pin, "click", pushpinClicked);
    map.entities.push(pin);
    map.setOptions({
      center: location
    });
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

  Microsoft.Maps.loadModule("Microsoft.Maps.Directions", () => {
    const directionsManger = new Microsoft.Maps.Directions.DirectionsManager(
      map
    );

    directionsManager.setRenderOptions({
      itineraryContainer: document.getElementById("printoutPanel"),
      showInputPanel: true
    });
  });

  /**
   * LOAD COMPONENTS AND SETUP PAGE/MAP
   */

  loadMapScenario();

  populateMapWith(schools);

  getLocation();
});
