"""Strip the white background from new.gif, producing a transparent animated GIF.

Keeps the original ADASI logo colors (grey text + orange accent) and turns every
near-white background pixel fully transparent. Frame durations and looping are
preserved from the source.
"""
from PIL import Image

SRC = "new.gif"
OUT = "_adasi_transparent.gif"

# A pixel counts as "background" when all three channels are very light.
# Background is 250-255; logo text/accent are far darker, so this cleanly
# separates them while leaving anti-aliased edges mostly intact.
WHITE = 238

im = Image.open(SRC)
frames = []
durations = []

for i in range(im.n_frames):
    im.seek(i)
    durations.append(im.info.get("duration", 100))
    rgba = im.convert("RGBA")
    r, g, b, _ = rgba.split()

    # transparent where r>WHITE AND g>WHITE AND b>WHITE
    rr = r.point(lambda v: 255 if v > WHITE else 0)
    gg = g.point(lambda v: 255 if v > WHITE else 0)
    bb = b.point(lambda v: 255 if v > WHITE else 0)
    from PIL import ImageChops
    is_white = ImageChops.multiply(ImageChops.multiply(rr, gg), bb)  # 255 where all light

    # Quantize the RGB content to 255 colors, reserve index 255 for transparency.
    pal = rgba.convert("RGB").quantize(colors=255, method=Image.MEDIANCUT)
    pal.paste(255, is_white)  # set background pixels to the reserved index
    pal.info["transparency"] = 255
    frames.append(pal)

frames[0].save(
    OUT,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=im.info.get("loop", 0),
    disposal=2,            # restore to background between frames (clean transparency)
    transparency=255,
    optimize=False,
)
print("wrote", OUT, "frames", len(frames))
