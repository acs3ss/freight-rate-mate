/*************************************** MAPBOX INITIALIZATION ***************************************/
mapboxgl.accessToken = 'pk.eyJ1IjoicmFzaGlkbGFza2VyIiwiYSI6ImNqOXh1b2xodjgwdmQycXBhNmpxN21na2cifQ.b7-TzrKTZ3Y_epVuBVynxA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [-120, 50],
    zoom: 2
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
    d3.json('./data/routes.geojson', function(err, data) {
        if (err) throw err;
        
        var coordinateList = [];
        for (var i = 0; i < data.features.length; i++) {
            // save full coordinate list for later
            coordinateList[i] = data.features[i].geometry.coordinates;
            
            // start by showing just the first coordinate
            data.features[i].geometry.coordinates = [coordinateList[i][0]];
            var featurePoint = JSON.parse('{"type": "FeatureCollection", "features": [' + JSON.stringify(data.features[i]) + ']}');
            console.log(featurePoint);
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
        }
        // setup the viewport
//        map.jumpTo({ 'center': coordinates[0], 'zoom': 14 });
//        map.setPitch(30);

        // on a regular basis, add more coordinates from the saved list and update the map
        var j = 0;
        var timer = window.setInterval(function() {
            for (var i = 0; i < coordinateList.length; i++) {
                if (j < coordinateList[i].length) {
                    data.features[i].geometry.coordinates.push(coordinateList[i][j]);
                    map.getSource('trace0').setData(data);
                    //map.panTo(coordinateList[i][j]);
                    j++;
                } else {
                    window.clearInterval(timer);
                }
            }
        }, 1000);
    });
    map.loadImage('https://png.icons8.com/metro/1600/interstate-truck.png', function(error, image) {
        if (error) throw error;
        map.addImage('truck', image);
        /*************************************** SYMBOL LAYER ***************************************/
        map.addLayer({
            "id": "points",
            "type": "symbol",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [0, 0]
                        }
                    }]
                }
            },
            "layout": {
                "icon-image": "truck",
                "icon-size": 0.1,
                "icon-rotate": 180
            }
        });
    });
});

/*************************************** TOGGLE LAYERS ***************************************/
var toggleableLayerIds = [ 'riskdata-heat', 'lines' ];

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

        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}
