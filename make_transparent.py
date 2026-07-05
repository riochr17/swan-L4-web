from PIL import Image
import os

input_path = '/home/rio/.gemini/antigravity/brain/3fae1054-b5d5-434a-bb84-db414f679348/swan_logo_1783266532117.png'
output_path = '/home/rio/SourceCode/swan-l4-web/public/swan_logo.png'

if os.path.exists(input_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Check if the pixel is dark (representing the black background)
        # item[0], item[1], item[2] are R, G, B values
        if item[0] < 45 and item[1] < 45 and item[2] < 45:
            # Make it fully transparent
            newData.append((0, 0, 0, 0))
        else:
            # Keep the white lines intact
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print("Successfully created transparent swan logo.")
else:
    print(f"Error: Input path {input_path} does not exist.")
