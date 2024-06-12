import base64
import io
import json
import sys
import os
import tempfile
import subprocess
from pyffmpeg import FFmpeg
from image_brightness import calculate_brightness


from PIL import Image

THUMB_WIDTH = 80

ffmpeg_bin = FFmpeg().get_ffmpeg_bin()

for line in sys.stdin:
    filename = line.strip()

    if filename == '':
        break

    _, ext = os.path.splitext(filename)
    if ext == '.mp4':
        tmpfile = tempfile.NamedTemporaryFile(suffix='.jpg').name
        subprocess.run(
            [ffmpeg_bin, '-y', '-i', filename, '-frames:v', '1', tmpfile],
            check=True
        )
        filename = tmpfile

    im = Image.open(filename)

    im_resized = im.resize(
        (THUMB_WIDTH, (im.size[1] * THUMB_WIDTH) // im.size[0]))

    buf = io.BytesIO()
    im_resized.convert('RGB').save(buf, format='jpeg', quality=50)
    thumb = base64.b64encode(bytes(buf.getbuffer())).decode()
    brightness = calculate_brightness(buf)

    print(json.dumps(dict(
        width=im.size[0],
        height=im.size[1],
        brightness=brightness,
        thumbnail=f'data:image/jpeg;base64,{thumb}',
    )), flush=True)
