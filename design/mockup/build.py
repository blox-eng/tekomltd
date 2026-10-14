import json,re,html,base64,sys,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
P=json.load(open('data/projects.json')); geo=json.load(open('data/geo.json'))
wp={p['id']:p for p in json.load(open('data/portfolio.json'))}
b64=lambda f,mt:'data:%s;base64,%s'%(mt,base64.b64encode(open(f,'rb').read()).decode())
for p in P:
    g=geo[str(p['id'])]; p['ll']=[round(g[0],5),round(g[1],5)]
    txt=re.sub(r'<[^>]+>',' ',wp[p['id']]['content']['rendered']); txt=re.sub(r'\[[^\]]*\]',' ',txt); txt=html.unescape(re.sub(r'\s+',' ',txt)).strip()
    txt=re.split(r'\s(?:ДАТА|Детайли)\s',txt)[0]
    s=re.search(r'(Сградата|Къщата|Комплекс|Този|Тази|Обектът|Параклисът|Басейнът|Проектирана)',txt)
    if s: txt=txt[s.start():]
    ends=[x.end() for x in re.finditer(r'(?<!\bул)(?<!\bинж)(?<!\bарх)(?<!\bгр)(?<!\bс)(?<!\bкв)(?<!\bХ)(?<!\bД)(?<!\bг)\.[“”"]?(?=\s+[А-ЯA-Z])',txt) if 180<=x.end()<=460]
    p['desc']=txt[:ends[-1]] if ends else txt[:400].rsplit(' ',1)[0]+'…'
imgs={str(p['id']):b64('covers/%d.jpg'%p['id'],'image/jpeg') for p in P}
logo=b64('tekom-logo.png','image/png')
brands=[[n,b64('logos/%s.png'%f,'image/png')] for n,f in [('Baumit','baumit'),('Sika','sika'),('Knauf','knauf'),('Mapei','mapei'),('REHAU','rehau'),('Wienerberger','wienerberger'),('Schüco','schueco'),('Rockwool','rockwool')]]
t=open('mockup.tpl.html').read()
t=t.replace('{{IMG:logo}}',logo).replace('__PROJECTS__',json.dumps(P,ensure_ascii=False)).replace('__IMAGES__',json.dumps(imgs)).replace('__BRANDS__',json.dumps(brands))
open('index.html','w').write(t)
