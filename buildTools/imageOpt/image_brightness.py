from PIL import Image
import numpy as np

def calculate_brightness(image_path):
    image = Image.open(image_path)

    # Convert the image to grayscale
    gray_image = image.convert('L')

    # Convert grayscale image to numpy array
    gray_array = np.asarray(gray_image)

    # Calculate the mean brightness
    mean_brightness = np.mean(gray_array)

    return mean_brightness
