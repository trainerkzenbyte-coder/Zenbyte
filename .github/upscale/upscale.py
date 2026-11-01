# AI upscaling (Real-ESRGAN "general v3", free and open source, BSD-3 licence)
# Usage: python upscale.py <in_dir> <out_dir> <stills_dir> <first_frame_number>
import os, sys, glob
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image

torch.set_num_threads(os.cpu_count() or 4)

class SRVGGNetCompact(nn.Module):
    def __init__(self, nf=64, nc=32, up=4):
        super().__init__()
        self.up = up
        body = [nn.Conv2d(3, nf, 3, 1, 1), nn.PReLU(nf)]
        for _ in range(nc):
            body += [nn.Conv2d(nf, nf, 3, 1, 1), nn.PReLU(nf)]
        body.append(nn.Conv2d(nf, 3 * up * up, 3, 1, 1))
        self.body = nn.ModuleList(body)
        self.ps = nn.PixelShuffle(up)

    def forward(self, x):
        o = x
        for l in self.body:
            o = l(o)
        return self.ps(o) + F.interpolate(x, scale_factor=self.up, mode='nearest')

here = os.path.dirname(os.path.abspath(__file__))
a = torch.load(os.path.join(here, 'w/general.pth'), map_location='cpu')['params']
b = torch.load(os.path.join(here, 'w/wdn.pth'), map_location='cpu')['params']
DN = float(os.environ.get('DENOISE', '0.75'))          # 1 = strongest clean-up of blocky compression
net = SRVGGNetCompact()
net.load_state_dict({k: DN * a[k] + (1 - DN) * b[k] for k in a})
net.eval().to(memory_format=torch.channels_last)

src, dst, stills, first = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
STILLS = {int(x) for x in open(os.path.join(here, 'stills.txt')).read().split()}
os.makedirs(dst, exist_ok=True); os.makedirs(stills, exist_ok=True)
files = sorted(glob.glob(os.path.join(src, '*.png')))
for k, f in enumerate(files):
    n = first + k
    img = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32) / 255.0
    x = torch.from_numpy(img).permute(2, 0, 1).unsqueeze(0).contiguous(memory_format=torch.channels_last)
    with torch.inference_mode():
        y = net(x).clamp_(0, 1)
    out = (y[0].permute(1, 2, 0).numpy() * 255.0 + 0.5).astype(np.uint8)
    big = Image.fromarray(out)                                  # 3264 x 1856
    big.resize((1920, 1092), Image.LANCZOS).save(os.path.join(dst, '%06d.png' % k), compress_level=1)
    if n in STILLS:
        big.save(os.path.join(stills, 'stop-%d.jpg' % n), quality=90, optimize=True)
        big.resize((1920, 1092), Image.LANCZOS).save(os.path.join(stills, 'stop-%d-m.jpg' % n), quality=86, optimize=True)
    if k % 10 == 0:
        print(n, flush=True)
