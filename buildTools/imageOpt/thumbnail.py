import base64
import io
import json
import sys
import os
import pathlib
import tempfile
import subprocess
import tempfile
from image_brightness import calculate_brightness

import platform

if platform.system() == 'Darwin':
   plat = 'mac'
elif platform.system() == 'Linux':
   plat = 'linux'
else:
   raise RuntimeError('no static ffmpeg build for your platform')

arch = platform.machine().lower()
if arch == "aarch64" or arch == "arm64":
    arch = "arm64"
elif arch == "x86_64" or arch == "amd64":
    arch = "amd64"
else:
    print("Unknown architecture:", arch)

ffmpeg_zip = (
    pathlib.Path(__file__).parent / 
    f'../../vendor/ffmpeg/ffmpeg-{plat}-{arch}.zip'
)
ffmpeg_zip = ffmpeg_zip.resolve(strict=True)

ffmpeg = (
    pathlib.Path(tempfile.gettempdir()) /
    'ffmpeg'
)

if not ffmpeg.exists():
    import zipfile
    with zipfile.ZipFile(ffmpeg_zip, 'r') as zzz:
        zzz.extract('ffmpeg', ffmpeg.parent.resolve())

if not ffmpeg.exists():
    raise RuntimeError("can't unpack ffmpeg from zip")

ffmpeg = ffmpeg.resolve(strict=True)

st = os.stat(ffmpeg)
os.chmod(ffmpeg, st.st_mode | 0o100)

from PIL import Image

THUMB_WIDTH = 80

for line in sys.stdin:
    filename = line.strip()

    if filename == '':
        break

    _, ext = os.path.splitext(filename)
    if ext == '.mp4':
        tmpfile = tempfile.NamedTemporaryFile(suffix='.jpg').name
        subprocess.run(
            [ffmpeg, '-y', '-i', filename, '-frames:v', '1', tmpfile],
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
