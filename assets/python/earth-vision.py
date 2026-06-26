#import necessary libraries
import cv2
import numpy as np
import requests
from requests.auth import HTTPBasicAuth

#define the area of interest
latitude = 40.7128
longitude = -74.0060
radius = 50

#define the two most recent changesets
changeset1 = '2019-01-01'
changeset2 = '2020-01-01'

#define the NASA EarthData API endpoint
endpoint = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi'

#define the parameters for the API request
params = {
    'layer': 'BlueMarble_ShadedRelief_Bathymetry',
    'tilematrixset': 'EPSG4326_500m',
    'Service': 'WMTS',
    'Request': 'GetTile',
    'Version': '1.0.0',
    'Format': 'image/jpeg',
    'TileMatrix': 'EPSG4326_500m:{z}',
    'TileCol': '{x}',
    'TileRow': '{y}'
}

#define the authentication for the API request
auth = HTTPBasicAuth('username', 'password')

#make the API request for the first changeset
r1 = requests.get(endpoint, params=params, auth=auth,
                  params={'time': changeset1})

#make the API request for the second changeset
r2 = requests.get(endpoint, params=params, auth=auth,
                  params={'time': changeset2})

#read the response into OpenCV
img1 = cv2.imdecode(np.frombuffer(r1.content, np.uint8), -1)
img2 = cv2.imdecode(np.frombuffer(r2.content, np.uint8), -1)

#compare the two images
diff = cv2.absdiff(img1, img2)

#display the difference
cv2.imshow('difference', diff)
cv2.waitKey(0)
cv2.destroyAllWindows()