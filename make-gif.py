import sys, glob, os
from PIL import Image

frames_dir = sys.argv[1]
gif_path   = sys.argv[2]
delays     = list(map(int, sys.argv[3].split(',')))

files  = sorted(glob.glob(os.path.join(frames_dir, 'frame_*.png')))
images = [Image.open(f).convert('RGBA') for f in files]

# Crop to just the splash area (top portion of the window)
# The splash is centered; we'll just use the full window size
images[0].save(
    gif_path,
    save_all=True,
    append_images=images[1:],
    duration=delays[:len(images)],
    loop=0,
    optimize=True,
)
print(gif_path)
