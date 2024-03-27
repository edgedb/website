import base64
import io
import json
import sys
import os
import tempfile
import subprocess
from pyffmpeg import FFmpeg

from PIL import Image

THUMB_WIDTH = 20


if __name__ == '__main__':
    fn = sys.argv[1]
    _, ext = os.path.splitext(fn)
    if ext == '.mp4':
        tmpfile = tempfile.NamedTemporaryFile(suffix='.jpg').name
        ff = FFmpeg()
        subprocess.run(
            [ff.get_ffmpeg_bin(), '-y', '-i', fn, '-frames:v', '1', tmpfile],
            check=True
        )
        fn = tmpfile

    im = Image.open(fn)

    im_resized = im.resize(
        (THUMB_WIDTH, (im.size[1] * THUMB_WIDTH) // im.size[0]))

    buf = io.BytesIO()
    im_resized.convert('RGB').save(buf, format='jpeg', quality=50)
    thumb = base64.b64encode(bytes(buf.getbuffer())).decode()

    print(json.dumps(dict(
        width=im.size[0],
        height=im.size[1],
        thumbnail=f'data:image/jpeg;base64,{thumb}',
    )))
