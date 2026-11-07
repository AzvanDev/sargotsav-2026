import base64,json,sys
logo=base64.b64encode(open('logo.webp','rb').read()).decode()
items=open('items.json').read()
for src,out in [('form.src.html','register.html'),('admin.src.html','admin.html')]:
    try: s=open(src).read()
    except FileNotFoundError: continue
    open(out,'w').write(s.replace('__LOGO__',logo).replace('__ITEMS__',items))
    print('built',out)
