import math

def how_long_does_it_take(distanceKilometers, speedKilometersPerHour):
    timeInHours = round(distanceKilometers / speedKilometersPerHour, 2)
    print("--------------------------------")
    print("How Long Does It Take?")
    print("--------------------------------")
    print(f"Distance: {distanceKilometers} kilometers")
    print(f"Speed: {speedKilometersPerHour} kilometers per hour")
    print(f"It will take {timeInHours} hours to reach the destination.")   
    print("--------------------------------")

def calculate_speed(distanceKilometers, timeInHours):
    speedKilometersPerHour = round(distanceKilometers / timeInHours, 2)
    print("--------------------------------")
    print("Calculate Speed")
    print("--------------------------------")
    print(f"Distance: {distanceKilometers} kilometers")
    print(f"Time: {timeInHours} hours")
    print(f"Speed: {speedKilometersPerHour} kilometers per hour")
    print("--------------------------------")

how_long_does_it_take(65.2, 10)
calculate_speed(55.2, 8.5)