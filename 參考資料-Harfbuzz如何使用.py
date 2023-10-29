import sys

import uharfbuzz as hb


fontfile = sys.argv[1]
text = sys.argv[2]

blob = hb.Blob.from_file_path(fontfile)
face = hb.Face(blob)
font = hb.Font(face)

px = 96
scale = 1000000.0/952997
font.scale = (px *scale* 1024, px*scale * 1024)

buf = hb.Buffer()
buf.add_str(text)
buf.guess_segment_properties()

features = {"kern": True, "liga": True}
hb.shape(font, buf, features)

infos = buf.glyph_infos
positions = buf.glyph_positions

for info, pos in zip(infos, positions):
    gid = info.codepoint
    cluster = info.cluster
    x_advance = pos.x_advance / 1024
    y_advance = pos.y_advance / 1024
    x_offset = pos.x_offset / 1024
    y_offset = pos.y_offset /1024
    print(f"gid{gid}={cluster}@{x_advance},{y_offset}+{x_advance},{y_advance}")