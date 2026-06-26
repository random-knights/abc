
import requests
import json

# Get the data from the NASA NeoWs API
url = 'https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=DEMO_KEY'
response = requests.get(url)

# Parse the response
data = json.loads(response.text)

# Print the top 25 closest asteroids to Earth and their current distance and velocity
print('Top 25 Closest Asteroids to Earth and Their Current Distance and Velocity')
print('------------------------------------------------------')
for asteroid in data['near_earth_objects'][:25]:
    print(f"Name: {asteroid['name']}")
    print(f"Distance: {asteroid['close_approach_data'][0]['miss_distance']['kilometers']} km")
    print(f"Velocity: {asteroid['close_approach_data'][0]['relative_velocity']['kilometers_per_second']} km/s")
    print('------------------------------------------------------')