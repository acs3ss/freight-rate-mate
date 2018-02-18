import json

with open('crash_xaaaf.geojson') as json_data:
    data = json.load(json_data)
    for element in data['features']: 
        del element['properties']['ZINJ_EJECTION']
        del element['properties']['ZUNI_INJUREDAGE']
        del element['properties']['ZINJ_OCCPROTECT']
        del element['properties']['ZINJ_SEATING']
        del element['properties']['ZINJ_INJUREDGEN']
        del element['properties']['ZUNI_EJECTIONPATH']
        del element['properties']['ZUNI_TRAPPED']

    with open('crash_xaaaf.geojson', 'w') as outfile:
        json.dump(data, outfile)