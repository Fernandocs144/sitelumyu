import struct, json, math, random

SRC = '/app/frontend/public/models/base.glb'
OUT = '/app/frontend/public/models/robot_points.bin'
N = 16000

with open(SRC, 'rb') as fh:
    magic, ver, length = struct.unpack('<III', fh.read(12))
    json_len, json_type = struct.unpack('<II', fh.read(8))
    js = json.loads(fh.read(json_len).decode('utf-8'))
    bin_len, bin_type = struct.unpack('<II', fh.read(8))
    bin_data = fh.read(bin_len)

prim = js['meshes'][0]['primitives'][0]
acc = js['accessors'][prim['attributes']['POSITION']]
bv = js['bufferViews'][acc['bufferView']]
count = acc['count']
byte_offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
stride = bv.get('byteStride', 12)

pts = []
for i in range(count):
    off = byte_offset + i * stride
    x, y, z = struct.unpack_from('<fff', bin_data, off)
    pts.append((x, y, z))

# center + scale to height ~3.0
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; zs = [p[2] for p in pts]
cx = (min(xs)+max(xs))/2; cy = (min(ys)+max(ys))/2; cz = (min(zs)+max(zs))/2
maxdim = max(max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))
scale = 3.0 / maxdim

# subsample evenly to N
if len(pts) > N:
    step = len(pts) / N
    idx = [int(i*step) for i in range(N)]
else:
    idx = list(range(len(pts)))

random.seed(7)
flat = []
for i in idx:
    x, y, z = pts[i]
    flat.append(((x-cx)*scale, (y-cy)*scale, (z-cz)*scale))

with open(OUT, 'wb') as f:
    for x, y, z in flat:
        f.write(struct.pack('<fff', x, y, z))

print('wrote', len(flat), 'points to', OUT, 'bytes=', len(flat)*12)
print('bbox after scale:', round((max(xs)-min(xs))*scale,2), round((max(ys)-min(ys))*scale,2), round((max(zs)-min(zs))*scale,2))
