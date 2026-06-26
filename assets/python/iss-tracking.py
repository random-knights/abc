import requests
# import json
# import geocoder

# Get the current position of the International Space Station
url = 'http://api.open-notify.org/iss-now.json'
response = requests.get(url)
data = response.json()

# Get the current location of the user
url2 = 'http://ip-api.com/json'
response2 = requests.get(url2)
data2 = response2.json()

# Get the latitude and longitude of the user
user_lat = data2['lat']
user_lon = data2['lon']

# Get the current position of the ISS
iss_lat = data['iss_position']['latitude']
iss_lon = data['iss_position']['longitude']

# Calculate the distance between the ISS and the user
distance = ((float(iss_lat) - float(user_lat))**2 + (float(iss_lon) - float(user_lon))**2)**0.5

# Compare the two locations
if user_lat == iss_lat and user_lon == iss_lon:
    print('You and the ISS are in the same location!')
else:
    print('You and the ISS are not in the same location.')
# Print the distance
print("The distance between the International Space Station and your current location is %.2f km" % distance)

# Get the list of crew members
url = 'http://api.open-notify.org/astros.json'
response = requests.get(url)
data = response.json()

# Print the list of crew members
print('The current crew members of the ISS are:')
for person in data['people']:
    print(person['name'] + " | " + person['craft'])