import pytesseract, json, glob, os, re
from PIL import Image, ImageOps
HERE=os.path.dirname(os.path.abspath(__file__))
R=os.path.join(HERE,'..','..','assets')+'/'
def lines_of(img):
    d=pytesseract.image_to_data(img,lang='eng',config='--psm 11',output_type=pytesseract.Output.DICT)
    words=[dict(t=t,x=d['left'][i],y=d['top'][i],w=d['width'][i],h=d['height'][i]) for i,t in enumerate(d['text']) if t.strip() and float(d['conf'][i])>35]
    lines=[]
    for w in sorted(words,key=lambda w:w['x']):
        cy=w['y']+w['h']/2
        for L in lines:
            if abs(L['cy']-cy)<max(L['h'],w['h'])*0.45 and 0<=w['x']-L['x2']<max(L['h'],w['h'])*1.6:
                L['ws'].append(w); L['x2']=w['x']+w['w']; L['h']=max(L['h'],w['h']); break
        else: lines.append(dict(cy=cy,h=w['h'],x=w['x'],x2=w['x']+w['w'],ws=[w]))
    out=[]
    for L in lines:
        ws=L['ws']; out.append(dict(text=' '.join(w['t'] for w in ws),words=[[w['t'],w['x'],w['y'],w['x']+w['w'],w['y']+w['h']] for w in ws],box=[min(w['x'] for w in ws),min(w['y'] for w in ws),max(w['x']+w['w'] for w in ws),max(w['y']+w['h'] for w in ws)]))
    return out
def ov(a,b):
    ix=max(0,min(a[2],b[2])-max(a[0],b[0])); iy=max(0,min(a[3],b[3])-max(a[1],b[1]))
    return ix*iy/max(1,min((a[2]-a[0])*(a[3]-a[1]),(b[2]-b[0])*(b[3]-b[1])))
res={}
for p in sorted(glob.glob(R+'fig_*.png')):
    im=Image.open(p).convert('RGB'); g=im.convert('L'); W,H=im.size
    allL=[]
    def add(L):
        if not re.search(r'[A-Za-z]{2}',L['text']): return
        dup=[M for M in allL if M.get('rot')==L.get('rot') and ov(M['box'],L['box'])>0.5]
        if dup:
            M=dup[0]
            if len(L['text'])>len(M['text']): M.update(L)
        else: allL.append(L)
    for v in [g,ImageOps.invert(g),ImageOps.invert(im.split()[2]),ImageOps.invert(im.split()[0]),ImageOps.invert(im.split()[1])]:
        for L in lines_of(v): add(L)
    for v in [g,ImageOps.invert(g)]:
        rv=v.rotate(-90,expand=True)
        for L in lines_of(rv):
            u0,v0,u1,v1=L['box']; L['box']=[v0,H-1-u1,v1,H-1-u0]; L['rot']=90; L['words']=[]
            add(L)
    allL.sort(key=lambda r:(r['box'][1],r['box'][0]))
    res[os.path.basename(p)]=dict(size=im.size,lines=allL)
json.dump(res,open(os.path.join(HERE,'ocr3.json'),'w'),ensure_ascii=False,indent=1)
for k,v in res.items():
    for l in v['lines']:
        if l.get('rot'): print(k,l['box'],l['text'])
