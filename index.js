import { education as schools } from "./education.js";
//MAPS API KEY: An2BID8gjDrD-UScA6QxwaY9_2tZ5UfaDZpzaMyH3ZP3MfvTfapUtsG-6EafTre3

window.addEventListener("load", () => {
  let map;

  const { Pushpin, Map, Events, Location } = Microsoft.Maps;
  //const { DirectionsManager } = Microsoft.Maps.Directions;

  const loadMapScenario = () => {
    map = new Map(document.getElementById("myMap"), {});
  };

  // "Section 23 Program" "Secondary School" "Elementary School" "Post Secondary"
  // "Alternative Education" "Adult Learning" "Middle School"
  const getSchoolsByCategory = category => {
    return schools.filter(school => school.CATEGORY === category);
  };

  loadMapScenario();

  // console.log(Microsoft.Maps.Directions);

  // const directionsManger = new Microsoft.Maps.Directions.DirectionsManager(map);

  //directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('printoutPanel') });

  const populateMapWith = schools => {
    schools.map(school => {
      let location = new Location(school.LATITUDE, school.LONGITUDE);
      let pin = new Pushpin(location);
      Events.addHandler(pin, "click", () => {
        console.log("Push pin clicked");
      });
      map.entities.push(pin);
    });
  };

  populateMapWith(schools);

  Microsoft.Maps.loadModule("Microsoft.Maps.Directions", () => {
    const directionsManger = new Microsoft.Maps.Directions.DirectionsManager(
      map
    );

    directionsManager.setRenderOptions({
      itineraryContainer: document.getElementById("printoutPanel"),
      showInputPanel: true
    });
  });
});
