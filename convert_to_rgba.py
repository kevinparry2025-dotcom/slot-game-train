#!/usr/bin/env python3
"""
Convert fruit symbol PNG images to RGBA format with transparent background.
Makes white background transparent.
"""

from PIL import Image
import os
import sys

def convert_to_rgba_transparent(input_path, output_path):
    """Convert image to RGBA and make white background transparent."""
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        img = img.convert("RGBA")
        
        # Get image data
        datas = img.getdata()
        
        # Create new data with white pixels made transparent
        new_data = []
        for item in datas:
            # If pixel is white or near-white (with some tolerance)
            # Change it to transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                # Make it transparent (R, G, B, Alpha)
                new_data.append((255, 255, 255, 0))
            else:
                # Keep original pixel
                new_data.append(item)
        
        # Update image data
        img.putdata(new_data)
        
        # Save with transparency
        img.save(output_path, "PNG", optimize=False)
        print(f"✓ Converted: {os.path.basename(input_path)}")
        return True
        
    except Exception as e:
        print(f"✗ Error converting {input_path}: {e}")
        return False

def main():
    # Directory containing the fruit symbols
    fruit_dir = "/Users/admin/Documents/game/slot-game-train/assets/textures/symbols/fruits/fruits"
    
    # Process all 10 fruit symbols
    success_count = 0
    for i in range(10):
        filename = f"fruit_symbol_{i:02d}.png"
        input_path = os.path.join(fruit_dir, filename)
        
        if os.path.exists(input_path):
            # Overwrite the original file
            if convert_to_rgba_transparent(input_path, input_path):
                success_count += 1
        else:
            print(f"✗ File not found: {filename}")
    
    print(f"\n✅ Successfully converted {success_count}/10 images to RGBA with transparency")

if __name__ == "__main__":
    main()
