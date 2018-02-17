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
                            "description": "Test description1"
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-94.603271484375,39.08743603215884]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "description": "Test description2"
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-94.603271484375,39.08743603215884]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "description": "Test description3"
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
            var timer = window.setInterval(function() {
                var allComplete = true;
                for (var i = 0; i < lines.length; i++) {
                    if (0.05*j < turf.length(lines[i], options)) {
                        var newCoordinates = turf.along(lines[i], 0.05*j, options).geometry.coordinates;
                        point.features[i].geometry.coordinates = newCoordinates;
                        map.getSource('trucks').setData(point);
                        data.features[i].geometry.coordinates.push(newCoordinates);
                        map.getSource('trace' + i).setData(data);
                        //map.panTo(newCoordinates);
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
                var description = e.features[0].properties.description;

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
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
var toggleableLayerIds = [ 'riskdata-heat', 'lines' , 'trucks'];
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
        
        if(clickedLayer == "lines"){
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
        else if(clickedLayer == "trucks"){
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
