import sys
from PIL import Image

for line in sys.stdin:
    line = line.strip()

    if line == '':
        break

    sourcePath, *sizes = line.split()

    sourceImg = Image.open(sourcePath)

    for targetPath, width in zip(*[iter(sizes)]*2):
        resizedWidth = int(width)

        img = (
            sourceImg.convert('RGB') if targetPath.endswith('.jpg')
            else sourceImg
        )

        if resizedWidth != -1 and img.size[0] > resizedWidth:
            resizedHeight = round((resizedWidth / img.size[0]) * img.size[1])
            img = img.resize((resizedWidth, resizedHeight))

        img.save(targetPath)
