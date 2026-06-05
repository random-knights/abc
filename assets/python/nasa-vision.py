import requests
import cv2
from math import radians, sin, cos, sqrt, atan2

# Replace 'YOUR_API_KEY' with your NASA Earthdata API key
API_KEY = 'YOUR_API_KEY'

def download_satellite_image(latitude, longitude, date, output_file):
    url = f'https://api.nasa.gov/planetary/earth/imagery/?lon={longitude}&lat={latitude}&date={date}&dim=0.1&api_key={API_KEY}'
    response = requests.get(url)
    image_data = response.content
    with open(output_file, 'wb') as f:
        f.write(image_data)

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth's radius in kilometers

    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return distance * 0.621371  # Convert distance to miles

def main():
    # Specify the location coordinates (latitude and longitude) you want to analyze
    target_latitude = 37.7749
    target_longitude = -122.4194

    # Get the two most recent dates for satellite images from NASA Earthdata API
    url = f'https://api.nasa.gov/planetary/earth/assets?lon={target_longitude}&lat={target_latitude}&api_key={API_KEY}'
    response = requests.get(url)
    assets_data = response.json()
    if len(assets_data['results']) < 2:
        print("Not enough recent satellite images available for this location.")
        return

    # Download the two most recent satellite images
    image_url_1 = assets_data['results'][0]['url']
    image_url_2 = assets_data['results'][1]['url']
    download_satellite_image(target_latitude, target_longitude, image_url_1, 'satellite_image_1.jpg')
    download_satellite_image(target_latitude, target_longitude, image_url_2, 'satellite_image_2.jpg')

    # Calculate distance between the two satellite images' locations and check if it's within 50 miles
    distance = calculate_distance(target_latitude, target_longitude, assets_data['results'][0]['centroid']['lat'], assets_data['results'][0]['centroid']['lon'])
    if distance > 50:
        print("The two most recent satellite images are not within a 50-mile radius.")
        return

    # Perform image comparison using OpenCV (you can customize this part based on your comparison criteria)
    image1 = cv2.imread('satellite_image_1.jpg')
    image2 = cv2.imread('satellite_image_2.jpg')

    # Perform image comparison logic here...
    # You can use image processing techniques like pixel-wise comparisons, histogram comparisons, etc.

if __name__ == "__main__":
    main()
