"""Make a character .glb small enough for a website: drop face blend shapes,
remove hidden meshes, and shrink textures. Usage: slim_glb.py in.glb out.glb [drop_mesh_names...]"""
import json, struct, sys, io
from PIL import Image

src, dst, drop = sys.argv[1], sys.argv[2], set(sys.argv[3:])
d = open(src, 'rb').read()
jl = struct.unpack('<I', d[12:16])[0]
j = json.loads(d[20:20 + jl])
bin_off = 20 + jl + 8
B = d[bin_off:bin_off + struct.unpack('<I', d[20 + jl:24 + jl])[0]]

for n in j['nodes']:
    if 'mesh' in n and j['meshes'][n['mesh']].get('name') in drop:
        del n['mesh']; n.pop('skin', None)
for m in j['meshes']:
    m.pop('weights', None); m.pop('extras', None)
    for p in m['primitives']:
        p.pop('targets', None); p.pop('extras', None)

used_meshes = {n['mesh'] for n in j['nodes'] if 'mesh' in n}
used_acc = set()
for mi in used_meshes:
    for p in j['meshes'][mi]['primitives']:
        used_acc.update(p['attributes'].values())
        if 'indices' in p: used_acc.add(p['indices'])
for s in j.get('skins', []):
    if 'inverseBindMatrices' in s: used_acc.add(s['inverseBindMatrices'])
for a in j.get('animations', []):
    for smp in a['samplers']: used_acc.update([smp['input'], smp['output']])
for i, a in enumerate(j['accessors']):
    if i not in used_acc:
        a.pop('bufferView', None); a.pop('byteOffset', None); a.pop('sparse', None)

alpha_imgs = set()
for mat in j.get('materials', []):
    if mat.get('alphaMode') in ('BLEND', 'MASK'):
        t = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
        if t is not None: alpha_imgs.add(j['textures'][t['index']]['source'])

views, out = [], bytearray()
def put(data):
    while len(out) % 4: out.append(0)
    off = len(out); out.extend(data); return off
new_index = {}
for i, a in enumerate(j['accessors']):
    bv = a.get('bufferView')
    if bv is None: continue
    if bv not in new_index:
        v = j['bufferViews'][bv]
        data = B[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        nv = dict(v); nv['byteOffset'] = put(data); nv['buffer'] = 0
        new_index[bv] = len(views); views.append(nv)
    a['bufferView'] = new_index[bv]
for k, im in enumerate(j.get('images', [])):
    v = j['bufferViews'][im['bufferView']]
    raw = B[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    img = Image.open(io.BytesIO(raw)); img.load()
    mx = 1024
    if max(img.size) > mx:
        s = mx / max(img.size); img = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.LANCZOS)
    buf = io.BytesIO()
    if k in alpha_imgs and img.mode in ('RGBA', 'LA', 'P'):
        img.save(buf, 'PNG', optimize=True); im['mimeType'] = 'image/png'
    else:
        img.convert('RGB').save(buf, 'JPEG', quality=84, optimize=True); im['mimeType'] = 'image/jpeg'
    data = buf.getvalue()
    views.append({'buffer': 0, 'byteOffset': put(data), 'byteLength': len(data)})
    im['bufferView'] = len(views) - 1
j['bufferViews'] = views
while len(out) % 4: out.append(0)
j['buffers'] = [{'byteLength': len(out)}]
js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb)
print(dst, len(glb))
