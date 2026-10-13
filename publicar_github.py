"""Publica el proyecto en un repositorio nuevo usando Git Credential Manager."""
import json
import os
import subprocess
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent/'.build-deps'))
import requests

ROOT=Path(__file__).resolve().parent
NAME='bradescard-control-cobertura'
EXPECTED_USER='vicenteqm'
FILES=['.gitignore','.github','site','tests','README.md','actualizar.py','fuentes_bradescard.py','ACTUALIZAR_BRADESCARD.bat','requirements.txt','publicar_github.py']

def main():
    env=dict(os.environ,GIT_TERMINAL_PROMPT='0',GCM_INTERACTIVE='never')
    credential=subprocess.run(['C:/Users/plantilla.r3/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,env=env,cwd=ROOT,timeout=30)
    if credential.returncode:
        raise RuntimeError('Git Credential Manager no tiene una sesión de GitHub disponible; se requiere iniciar sesión')
    values=dict(line.split('=',1) for line in credential.stdout.splitlines() if '=' in line)
    token=values.get('password')
    if not token:raise RuntimeError('No hay credencial Git disponible')
    session=requests.Session();session.headers.update({'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
    def api(method,path,expected=(200,),**kwargs):
        response=session.request(method,'https://api.github.com'+path,timeout=45,**kwargs)
        if response.status_code not in expected:raise RuntimeError('GitHub rechazó '+method+' '+path+' (HTTP '+str(response.status_code)+')')
        return response.json() if response.content else None
    user=api('GET','/user')['login']
    if user!=EXPECTED_USER:raise RuntimeError('La cuenta Git autenticada no coincide con la cuenta conectada '+EXPECTED_USER)
    if '--estado' in sys.argv:
        runs=api('GET','/repos/'+user+'/'+NAME+'/actions/runs?per_page=3')
        print(json.dumps([{'id':r['id'],'status':r['status'],'conclusion':r['conclusion'],'url':r['html_url']} for r in runs['workflow_runs']],indent=2))
        response=requests.get('https://'+user+'.github.io/'+NAME+'/',timeout=30)
        print('HTTP del tablero: '+str(response.status_code))
        return
    info=api('GET','/repos/'+user+'/'+NAME,expected=(200,404))
    if info and info.get('full_name'):
        remotes=subprocess.check_output(['C:/Users/plantilla.r3/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe','remote','get-url','origin'],cwd=ROOT,text=True).strip()
        if remotes!='https://github.com/'+user+'/'+NAME+'.git':raise RuntimeError('Ya existe un repositorio con ese nombre; no se reemplaza')
    else:
        info=api('POST','/user/repos',expected=(201,),json={'name':NAME,'description':'Tablero BRADESCARD de cobertura, tiendas, asistencia y seguimiento operativo','private':False,'auto_init':False})
    print('Repositorio: '+info['html_url'],flush=True)
    def git(*args):subprocess.run(['C:/Users/plantilla.r3/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe',*args],cwd=ROOT,env=env,check=True)
    # Solo archivos de implementación y datos agregados; nunca fuentes o secretos.
    git('add','--',*FILES)
    staged=subprocess.check_output(['C:/Users/plantilla.r3/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe','diff','--cached','--name-only'],cwd=ROOT,text=True).splitlines()
    if any(p.startswith(('inputs/','.private/','logs/','.build-deps/')) or p.endswith(('.xlsx','.xlsm','.csv')) or p=='config.local.json' for p in staged):raise RuntimeError('El índice contiene archivos privados; publicación detenida')
    if staged:git('commit','-m','Publicar tablero de cobertura BRADESCARD y proceso de actualización')
    git('branch','-M','main')
    remotes=subprocess.check_output(['C:/Users/plantilla.r3/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe','remote'],cwd=ROOT,text=True).splitlines()
    if 'origin' not in remotes:git('remote','add','origin',info['clone_url'])
    git('push','-u','origin','main')
    pages=api('GET','/repos/'+user+'/'+NAME+'/pages',expected=(200,404))
    if not pages or not pages.get('html_url'):
        pages=api('POST','/repos/'+user+'/'+NAME+'/pages',expected=(201,202),json={'build_type':'workflow'})
    print('Pages configurado: '+str(pages.get('html_url','despliegue pendiente')),flush=True)
    # Pages puede habilitarse después del primer push; se vuelve a solicitar el despliegue.
    api('POST','/repos/'+user+'/'+NAME+'/actions/workflows/pages.yml/dispatches',expected=(204,),json={'ref':'main'})
    (ROOT/'logs').mkdir(exist_ok=True)
    (ROOT/'logs'/'publicacion.json').write_text(json.dumps({'repository':info['html_url'],'pages':pages.get('html_url'),'status':'deployment_requested'},indent=2),encoding='utf-8')

if __name__=='__main__':
    try:main()
    except Exception as error:
        # Los errores no imprimen la respuesta ni las credenciales de Git.
        print(type(error).__name__+': '+str(error),file=sys.stderr);sys.exit(1)
