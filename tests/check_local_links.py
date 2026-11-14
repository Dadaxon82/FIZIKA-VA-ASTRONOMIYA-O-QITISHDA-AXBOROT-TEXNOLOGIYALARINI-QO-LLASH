from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.urls=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ("href","src") and v:self.urls.append(v)
bad=[];count=0
for page in ROOT.rglob("*.html"):
 p=Links();p.feed(page.read_text(encoding="utf-8",errors="replace"))
 for href in p.urls:
  if href.startswith(("#","//","mailto:","tel:","data:","javascript:")):continue
  u=urlsplit(href)
  if u.scheme or u.netloc or not u.path:continue
  target=ROOT/unquote(u.path).lstrip("/") if u.path.startswith("/") else page.parent/unquote(u.path)
  count+=1
  if not target.exists():bad.append((str(page.relative_to(ROOT)),href))
assert not bad, "Missing resources: "+repr(bad[:30])
print("OK: checked",count,"internal links")
