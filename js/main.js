mapboxgl.accessToken = 'pk.eyJ1IjoicmFzaGlkbGFza2VyIiwiYSI6ImNqOXh1b2xodjgwdmQycXBhNmpxN21na2cifQ.b7-TzrKTZ3Y_epVuBVynxA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [-120, 50],
    zoom: 2
});

map.on('load', function() {
    // Add a geojson point source.
    // Heatmap layers also work with a vector tile source.
    map.addSource('riskdata', {
        "type": "geojson",
        "data": {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"mag": 7 }, "geometry": {"type": "Point", "coordinates": [-95.60302734375, 37.45741810262938 ] } }, {"type": "Feature", "properties": {"mag": 3 }, "geometry": {"type": "Point", "coordinates": [-95.6689453125, 38.77121637244273 ] } }, {"type": "Feature", "properties": {"mag": 1 }, "geometry": {"type": "Point", "coordinates": [-96.8994140625, 38.09998264736481 ] } }, {"type": "Feature", "properties": {"mag": 1 }, "geometry": {"type": "Point", "coordinates": [-93.779296875, 38.25543637637947 ] } }, {"type": "Feature", "properties": {"mag": 3 }, "geometry": {"type": "Point", "coordinates": [-93.7353515625, 39.095962936305476 ] } }, {"type": "Feature", "properties": {"mag": 7 }, "geometry": {"type": "Point", "coordinates": [-94.02099609375, 37.70120736474139 ] } } ] } });

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
});
