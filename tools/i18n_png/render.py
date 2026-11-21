import json, re, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE=os.path.dirname(os.path.abspath(__file__))
R=os.path.join(HERE,'..','..','assets')+'/'
FONTS={'dejavu':('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
       'liberation':('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf','/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf')}
o1=json.load(open(os.path.join(HERE,'ocr.json'))); o2=json.load(open(os.path.join(HERE,'ocr3.json')))
def lines(img):
    L=o2[img]['lines']+o1[img]['lines']
    return L
def parse():
    spec={}; cur=None
    for ln in open(os.path.join(HERE,'spec.txt'),encoding='utf-8'):
        ln=ln.rstrip('\n')
        if not ln or ln.startswith('#'): continue
        if ln.startswith('@'): cur=ln[1:]; spec[cur]={'font':'dejavu','e':[]}; continue
        if ln.startswith('FONT|'): spec[cur]['font']=ln.split('|')[1]; continue
        if ln.startswith('ERASE|'): spec[cur].setdefault('erase',[]).append([int(v) for v in ln.split('|')[1].split(',')]); continue
        if ln.startswith('ARC|'): spec[cur].setdefault('arc',[]).append([float(v) for v in ln.split('|')[1:]]); continue
        spec[cur]['e'].append(ln.split('|'))
    return spec
def ink(font,text):
    b=font.getbbox(text,anchor='ls'); return b
def colstats(a,box,bg):
    x0,y0,x1,y1=box; reg=a[y0:y1,x0:x1].reshape(-1,3).astype(int)
    d=np.abs(reg-bg).sum(1)
    if (d>90).sum()<5: return tuple(int(v) for v in (255-bg))
    sel=reg[d>=np.percentile(d,85)]
    return tuple(int(v) for v in np.median(sel,0))
def bgcol(a,box):
    x0,y0,x1,y1=box; H,W,_=a.shape
    x0=max(0,x0-3);y0=max(0,y0-3);x1=min(W-1,x1+3);y1=min(H-1,y1+3)
    ring=np.concatenate([a[y0,x0:x1],a[y1,x0:x1],a[y0:y1,x0],a[y0:y1,x1]])
    return np.median(ring,0).astype(int)
def render(img,lang):
    sp=SPEC[img]; im=Image.open(R+img).convert('RGB'); W,H=im.size
    a=np.array(im); dr=ImageDraw.Draw(im); ovl=Image.new('RGBA',im.size,(0,0,0,0)); dt=ImageDraw.Draw(ovl)
    reg,bold=FONTS[sp['font']]
    used={}
    for e in sp['e']:
        mode,key=e[0],e[1]; pvo=[]
        if mode.startswith('block:'):
            _,coords,fs_=mode.split(':'); bx=[int(v) for v in coords.split(',')]
            txt=(e[1] if lang=='ru' else e[2]).split('¶')
            bg=bgcol(a,bx); rg=a[bx[1]:bx[3],bx[0]:bx[2]].reshape(-1,3).astype(int); dd=np.abs(rg-bg).sum(1)
            col=tuple(int(v) for v in np.median(rg[dd>200],0))
            dr.rectangle(bx,fill=tuple(int(v) for v in bg))
            fb=ImageFont.truetype(reg,int(fs_)); n=len(txt); step=(bx[3]-bx[1])/n
            for i,tx in enumerate(txt):
                dt.text(((bx[0]+bx[2])/2,bx[1]+step*(i+0.5)),tx,font=fb,fill=col+(255,),anchor='mm')
            continue
        wide=mode.endswith('+'); mode=mode.rstrip('+')
        if mode.startswith('box:'):
            _,coords,*rest=mode.split(':'); box=[int(v) for v in coords.split(',')]
            rot='r90' if 'r90' in rest else ''
            uz,ru,en=e[1],e[2],e[3]; mode='l' if 'l' in rest else 'c'; trailing=False
            pvo=[int(r[1:]) for r in rest if r.startswith('p') and r[1:].isdigit()]
        else:
            uz,ru,en=e[2],e[3],e[4]; rot=''
            k=key.split('#')[0]; nth=int(key.split('#')[1]) if '#' in key else 1
            cands=[l for l in lines(img) if k in l['text']]
            # dedupe overlapping
            uniq=[]
            for c in cands:
                if not any(abs(c['box'][0]-u['box'][0])<20 and abs(c['box'][1]-u['box'][1])<20 for u in uniq): uniq.append(c)
            uniq.sort(key=lambda l:(l['box'][0]))
            if len(uniq)<nth: print('NOMATCH',img,key); continue
            ln=uniq[nth-1]; box=list(ln['box']); rot='r90' if ln.get('rot') else ''
            n=len(uz.split()); ws=ln.get('words') or []
            if mode in ('t','l') and len(ws)>n:
                f0=uz.split()[0][:3].lower(); idx=[i for i,w in enumerate(ws) if w[0][:3].lower()==f0 and i+n<=len(ws)]
                sub=ws[idx[0]:idx[0]+n] if idx else ws[-n:]; box=[min(w[1] for w in sub),min(w[2] for w in sub),max(w[3] for w in sub),max(w[4] for w in sub)]
            trailing = bool(ws) and len(ws)>n and box[2] < ln['box'][2]-5
            if mode=='t' and ws: mode='l'
        new=ru if lang=='ru' else en
        x0,y0,x1,y1=box; bh=y1-y0; bw=x1-x0
        if rot=='r90':
            bh,bw=bw,bh
        # choose font weight & size by ink height (and width when possible)
        best=None
        for fp in (reg,bold):
            f=ImageFont.truetype(fp,100); b=ink(f,uz); ih=b[3]-b[1]; iw=b[2]-b[0]
            s=100*bh/max(1,ih); wpred=iw*s/100
            err=abs(wpred-bw)/bw if mode!='t' else (0 if fp==reg else 0.05)
            if best is None or err<best[0]: best=(err,fp,s,wpred)
        _,fp,s,wuz=best
        fw=ImageFont.truetype(fp,100); bwid=fw.getbbox(uz,anchor='ls'); iw=bwid[2]-bwid[0]
        if iw>0:
            s_w=100*bw/iw
            if s>s_w*1.15: s=s_w; wuz=bw
        s=max(8,s)
        f=ImageFont.truetype(fp,int(round(s)))
        # text region to erase
        if mode=='t': ex=[int(x1-wuz-0.1*bh),y0,x1,y1]
        else: ex=[x0,y0,x1,y1]
        bg=bgcol(a,[ex[0],ex[1],ex[2],ex[3]]) if not rot else bgcol(a,box)
        col=colstats(a,box,bg)
        padv=pvo[0] if pvo else int(0.35*bh); padh=int(0.25*bh)
        if not rot and not pvo:
            for L in lines(img):
                lb=L['box']
                if L.get('rot') or lb==list(box): continue
                if min(lb[2],x1)-max(lb[0],x0) < 0.2*min(lb[2]-lb[0],bw): continue
                if lb[1]>=y1-2: padv=min(padv,max(1,lb[1]-y1-2))
                elif lb[3]<=y0+2: padv=min(padv,max(1,y0-lb[3]-2))
        if rot:
            dr.rectangle([box[0]-padh,box[1]-padv,box[2]+padh,box[3]+padv],fill=tuple(int(v) for v in bg))
        else:
            rx0,ry0,rx1,ry1=ex[0]-(padh if mode=='c' else int(0.08*bh)),ex[1]-padv,ex[2]+padh,ex[3]+padv
            dr.rectangle([rx0,ry0,rx1,ry1],fill=tuple(int(v) for v in bg))
            Hh,Ww,_=a.shape
            if ry0-2>=0 and ry1+2<Hh:
                for xx in range(max(0,rx0),min(Ww,rx1+1)):
                    c1=a[ry0-2,xx].astype(int); c2=a[ry1+2,xx].astype(int); c3=a[max(0,ry0-7),xx].astype(int); c4=a[min(Hh-1,ry1+7),xx].astype(int)
                    if np.abs(c1-c2).sum()<40 and np.abs(c1-c3).sum()<40 and np.abs(c2-c4).sum()<40 and np.abs(c1-bg).sum()>120:
                        dr.line([(xx,ry0),(xx,ry1)],fill=tuple(int(v) for v in c1))
            if rx0-2>=0 and rx1+2<Ww:
                for yy in range(max(0,ry0),min(Hh,ry1+1)):
                    c1=a[yy,rx0-2].astype(int); c2=a[yy,rx1+2].astype(int); c3=a[yy,max(0,rx0-7)].astype(int); c4=a[yy,min(Ww-1,rx1+7)].astype(int)
                    if np.abs(c1-c2).sum()<40 and np.abs(c1-c3).sum()<40 and np.abs(c2-c4).sum()<40 and np.abs(c1-bg).sum()>120:
                        dr.line([(rx0,yy),(rx1,yy)],fill=tuple(int(v) for v in c1))
        # width limits
        istitle = box[1]<0.13*H and bw>0.3*W
        if istitle: maxw=0.94*W
        elif wide: maxw=0.9*W
        elif mode=='c': maxw=max(bw*1.12,bw+0.6*bh,min(2.2*bw,9*bh))
        else: maxw=W-(x1-wuz if mode=='t' else x0)-0.02*W
        if trailing: maxw=bw*1.05
        linesout=[new]
        tw=f.getlength(new)
        if tw>maxw:
            if mode=='c' and not istitle and ' ' in new and maxw/tw<0.8:
                words=new.split(' '); best2=None
                for i in range(1,len(words)):
                    a1=' '.join(words[:i]); a2=' '.join(words[i:]); m=max(f.getlength(a1),f.getlength(a2))
                    if best2 is None or m<best2[0]: best2=(m,[a1,a2])
                linesout=best2[1]; tw=best2[0]
            if tw>maxw:
                s=s*maxw/tw; f=ImageFont.truetype(fp,int(s))
        if rot=='r90':
            t=Image.new('RGBA',(int(f.getlength(new))+20,int(s*1.6)),(0,0,0,0)); td=ImageDraw.Draw(t)
            td.text((t.width/2,t.height/2),new,font=f,fill=col+(255,),anchor='mm')
            t=t.rotate(90,expand=True)
            cx=(box[0]+box[2])//2; cy=(box[1]+box[3])//2
            ovl.paste(t,(cx-t.width//2,cy-t.height//2),t); continue
        cy=(y0+y1)/2
        if len(linesout)==2:
            gap=s*1.15
            for i,tx in enumerate(linesout):
                dt.text(((x0+x1)/2,cy+(i-0.5)*gap),tx,font=f,fill=col+(255,),anchor='mm')
            continue
        # vertical: align baseline approx: use middle of ink box
        b=f.getbbox(new,anchor='ls'); 
        bu=f.getbbox(uz,anchor='ls')
        # baseline so that uz ink box would fit y0..y1
        base=y1-bu[3]*(1 if True else 0)
        if mode=='c': dt.text(((x0+x1)/2,base),new,font=f,fill=col+(255,),anchor='ms')
        elif mode=='l': dt.text((x0,base),new,font=f,fill=col+(255,),anchor='ls')
        else: dt.text((x1-wuz,base),new,font=f,fill=col+(255,),anchor='ls')
    for bx in sp.get('erase',[]): dr.rectangle(bx,fill=tuple(int(v) for v in bgcol(a,bx)))
    for cx,cy,r,w in sp.get('arc',[]):
        S=4; big=Image.new('L',(im.width*S,im.height*S),0); bd=ImageDraw.Draw(big)
        bd.ellipse([(cx-r-w/2)*S,(cy-r-w/2)*S,(cx+r+w/2)*S,(cy+r+w/2)*S],outline=255,width=int(w*S))
        mask=big.resize(im.size,Image.LANCZOS); im.paste((0,0,0),(0,0),mask)
    im=Image.alpha_composite(im.convert('RGBA'),ovl).convert('RGB')
    out=f'{R}i18n/{lang}/{img}'
    os.makedirs(os.path.dirname(out),exist_ok=True); im.save(out,optimize=True)
SPEC=parse()
only=sys.argv[1:] or list(SPEC)
for img in only:
    for lang in ('ru','en'): render(img,lang)
print('done')
