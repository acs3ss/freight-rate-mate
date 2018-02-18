/*************************************** MAPBOX INITIALIZATION ***************************************/
mapboxgl.accessToken = 'pk.eyJ1IjoicmFzaGlkbGFza2VyIiwiYSI6ImNqOXh1b2xodjgwdmQycXBhNmpxN21na2cifQ.b7-TzrKTZ3Y_epVuBVynxA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [-95.729182,38.413121],
    zoom: 8
});

map.on('load', function() {
    /*************************************** HEATMAP LAYER ***************************************/
    map.addSource('riskdata', {
        "type": "geojson",
        "data": "./data/riskdata.geojson"
    });

    map.addLayer({
        "id": "riskdata-heat",
        "type": "heatmap",
        "source": "riskdata",
        "maxzoom": 9,
        "paint": {
            // Increase the heatmap weight based on frequency and property magnitude
            "heatmap-weight": [
                "interpolate",
                ["linear"],
                ["get", "mag"],
                0, 0,
                6, 1
            ],
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0, 1,
                9, 3
            ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparancy color
            // to create a blur-like effect.
            "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0, "rgba(33,102,172,0)",
                0.2, "rgb(103,169,207)",
                0.4, "rgb(209,229,240)",
                0.6, "rgb(253,219,199)",
                0.8, "rgb(239,138,98)",
                1, "rgb(178,24,43)"
            ],
            // Adjust the heatmap radius by zoom level
            "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0, 2,
                9, 20
            ],
            // Transition from heatmap to circle layer by zoom level
            "heatmap-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7, 1,
                9, 1
            ],
        }
    }, 'waterway-label');

    /*************************************** ROUTING LAYER ***************************************/
//    map.addSource('routes', {
//        'type': 'geojson',
//        'data': './data/routes.geojson'
//    });
//
//    map.addLayer({
//        'id': 'lines',
//        'type': 'line',
//        'source': 'routes',
//        'paint': {
//            'line-width': 3,
//            'line-color': ['get', 'color']
//        }
//    });
    
    /*************************************** SYMBOL LAYER ***************************************/
    map.loadImage('./img/truck.png', function(error, image) {
        if (error) throw error;
        map.addImage('truck', image);
        d3.json('./data/routes.geojson', function(err, data) {
            if (err) throw err;
            var lines = [];
            var options = {units: 'miles'};
            var point = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "truckID": 0,
                            "shipment-description": "High Priority Items",
                            "carrier-description": "JBHunt",
                            "driver-name": "Bill Richardson",
                            "driver-information": "Experienced veteran, 30yrs trucking",
                            "driver-reputation": "Good",
                            "driver-contact": "571-263-5955"
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-94.603271484375,39.08743603215884]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "truckID": 1,
                            "shipment-description": "Lots of potatoes. Literally a truckload",
                            "carrier-description": "Schneider",
                            "driver-name": "Lana Drah",
                            "driver-information": "Wishes she was an ice road trucker",
                            "driver-reputation": "Satisfactory",
                            "driver-contact": "571-263-5955"
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-94.603271484375,39.08743603215884]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "truckID": 2,
                            "shipment-description": "Fake Yeezys",
                            "carrier-description": "USA Truck",
                            "driver-name": "Xzzy Xavi",
                            "driver-information": "?????????",
                            "driver-reputation": "Risky",
                            "driver-contact": "571-263-5955"
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-94.603271484375,39.08743603215884]
                        }
                    }
                ]
            };
            map.addSource('trucks', { type: 'geojson', data: './data/point.geojson' });
            map.addLayer({
                "id": "trucks",
                "type": "symbol",
                "source": 'trucks',
                "layout": {
                    "icon-image": "truck",
                    "icon-size": 0.25,
                    "icon-padding" : 10
                }
            });
            for (var i = 0; i < data.features.length; i++) {
                // save full coordinate list for later
                lines[i] = turf.lineString(data.features[i].geometry.coordinates);
                // start by showing just the first coordinate
                var firstCoordinate = lines[i].geometry.coordinates[0];
                data.features[i].geometry.coordinates = [firstCoordinate];
                console.log(JSON.stringify(firstCoordinate));
                var featurePoint = JSON.parse('{"type": "FeatureCollection", "features": [' + JSON.stringify(data.features[i]) + ']}');
                // add it to the map
                map.addSource('trace' + i, { type: 'geojson', data: featurePoint });
                map.addLayer({
                    "id": "trace" + i,
                    "type": "line",
                    "source": "trace" + i,
                    "paint": {
                        "line-color": ['get', 'color'],
                        "line-opacity": 0.75,
                        "line-width": 5
                    }
                });
                point.features[i].geometry.coordinates = firstCoordinate;
                map.getSource('trucks').setData(point);
            }

            // on a regular basis, add more coordinates from the saved list and update the map
            var j = 0;
            var currID = -1;
            var timer = window.setInterval(function() {
                var allComplete = true;
                for (var i = 0; i < lines.length; i++) {
                    if (0.05*j < turf.length(lines[i], options)) {
                        var newCoordinates = turf.along(lines[i], 0.05*j, options).geometry.coordinates;
                        point.features[i].geometry.coordinates = newCoordinates;
                        map.getSource('trucks').setData(point);
                        data.features[i].geometry.coordinates.push(newCoordinates);
                        map.getSource('trace' + i).setData(data);
                        if(currID == i){
                            map.panTo(newCoordinates);
                            document.getElementById('details-location').innerHTML = "X: " + newCoordinates[0] + "<br>Y: " + newCoordinates[1];
                        }
                        j++;
                        allComplete = false;
                    }
                }
                if(allComplete) {
                    window.clearInterval(timer);
                }
            }, 100);
            
            map.on('click', 'trucks', function (e) {
                var coordinates = e.features[0].geometry.coordinates.slice();
                var description = e.features[0].properties["shipment-description"];
                var carrierDescription = e.features[0].properties["carrier-description"];
                var driverName = e.features[0].properties["driver-name"];
                var driverInfo = e.features[0].properties["driver-information"];
                var driverReputation = e.features[0].properties["driver-reputation"];
                var driverContact = e.features[0].properties["driver-contact"];
                console.log(e.features[0].properties);
                if(currID == e.features[0].properties.truckID){
                    currID = -1;
                    var elem = document.getElementById('reset-button');
                    elem.parentNode.removeChild(elem);
                    var elem = document.getElementById('contact-button');
                    elem.parentNode.removeChild(elem);
                    document.getElementById("details-text").innerHTML = "Click on a truck to the right.";
                    document.getElementById('details-location').innerHTML = "";
                } else {
                    currID = e.features[0].properties.truckID;
                    var fullDescription = "Shipment Description: " + description + "<br><br>" + "Carrier Description: " + carrierDescription + "<br><br>" + "Driver Name: " + driverName + "<br><br>" + "Driver Informaion: " + driverInfo + "<br><br>" + "Driver Reputation: " + driverReputation + "<br><br>" + "Driver Contact: " + driverContact;
                    document.getElementById("details-text").innerHTML = fullDescription;
                    if(!document.getElementById("reset-button")){
                        var resetButton = document.createElement("button");
                        resetButton.innerHTML = "Reset";
                        resetButton.id = "reset-button";
                        var elem = document.getElementById('button-parent');
                        elem.appendChild(resetButton);
                        resetButton.addEventListener ("click", function(){
                            currID = -1;
                            var elem = document.getElementById('reset-button');
                            elem.parentNode.removeChild(elem);
                            var elem = document.getElementById('contact-button');
                            elem.parentNode.removeChild(elem);
                            document.getElementById("details-text").innerHTML = "Click on a truck to the right.";
                            document.getElementById('details-location').innerHTML = "";
                        });
                    }
                    if(!document.getElementById("contact-button")){
                        var contactButton = document.createElement("button");
                        contactButton.innerHTML = "Send Alert";
                        contactButton.id = "contact-button";
                        var elem = document.getElementById('button-parent');
                        elem.appendChild(contactButton);
                        contactButton.addEventListener ("click", function(){
                            console.log('Sent Message');
                        });
                    }
                }                
            });

            // Change the cursor to a pointer when the mouse is over the places layer.
            map.on('mouseenter', 'trucks', function () {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Change it back to a pointer when it leaves.
            map.on('mouseleave', 'trucks', function () {
                map.getCanvas().style.cursor = '';
            });
        });
    });
});

/*************************************** TOGGLE LAYERS ***************************************/
var toggleableLayerIds = [ 'Risk Heatmap', 'Routes' , 'Trucks'];
var NUM_TRUCKS = 3;
for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function (e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();
        
        if(clickedLayer == "Routes"){
            if (this.className === 'active') {
                for (var i = 0; i < NUM_TRUCKS; i++){
                    map.setPaintProperty("trace" + i, 'line-opacity', 0);
                }
                this.className = '';
            } else {
                this.className = 'active';
                for (var i = 0; i < NUM_TRUCKS; i++){
                    map.setPaintProperty("trace" + i, 'line-opacity', 0.75);
                }
            }
        }
        else if(clickedLayer == "Trucks"){
            if (this.className === 'active') {
                map.setLayoutProperty("trucks", 'visibility', 'none');
                this.className = '';
            } else {
                this.className = 'active';
                map.setLayoutProperty("trucks", 'visibility', 'visible');
            }
        }
        else{
            var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
            if (visibility === 'visible') {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                this.className = '';
            } else {
                this.className = 'active';
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            }
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}
