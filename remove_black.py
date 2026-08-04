import sys
from PIL import Image

def remove_black(input_path, output_path, tolerance=30):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # item is (R, G, B, A)
        # If the pixel is close to black, make it transparent
        if item[0] < tolerance and item[1] < tolerance and item[2] < tolerance:
            # We can also feather it, but let's start with a hard threshold + semi-transparency for anti-aliasing
            # Calculate distance from black
            dist = max(item[0], item[1], item[2])
            if dist < 10:
                newData.append((0, 0, 0, 0)) # Fully transparent
            else:
                # Semi transparent for anti-aliasing
                alpha = int((dist - 10) / (tolerance - 10) * 255)
                newData.append((item[0], item[1], item[2], alpha))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    remove_black("src-tauri/icons/desktop.png", "src-tauri/icons/desktop.png")
