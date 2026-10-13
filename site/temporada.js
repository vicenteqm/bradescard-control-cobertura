'use strict';
(() => {
const root=document.documentElement;
const october=new Intl.DateTimeFormat('en',{month:'numeric',timeZone:'America/Mexico_City'}).format(new Date())==='10';
const get=key=>{try{return localStorage.getItem(key);}catch{return null;}};
const set=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
const sprites={
 ghost:['....WWWWWW......','...WWWWWWWW.....','..WWWWWWWWWW....','..WWWWWWWWWW....','..WWKKWWKKWW....','..WWKKWWKKWW....','..WWWWWWWWWW....','..WWWWKKWWWW....','..WWWWWWWWWW....','..WWWWWWWWWW....','.WWWWWWWWWWWW...','.WWW.WWW.WWWW...','..W...W...WW....'],
 pumpkin:['.......GG.......','......GG........','...OOOOOOOOOO...','..OOOOOOOOOOOO..','.OOOLOOOOLOOOOO.','.OOOKKOOOOKKOOO.','.OOOOOOOOOOOOOO.','.OOOOOKOOKOOOOO.','.OOOKKKKKKKOOOO.','..OOOKOOKOOOOO..','...OOOOOOOOOO...','.....OOOOOO.....'],
 skull:['....WWWWWWWW....','...WWWWWWWWWW...','..WWWWWWWWWWWW..','..WWWWWWWWWWWW..','..WWKKKWWKKKWW..','..WWKKKWWKKKWW..','..WWWWWKKWWWWW..','...WWWWKKWWWW...','....WWWWWWWW....','....WKWKWKWW....','....WWWWWWWW....'],
 bat:['K..............K','KK............KK','KKK...KKKK...KKK','KKKK..KWWK..KKKK','KKKKKKKKKKKKKKKK','..KKKKKKKKKKKK..','...KKKKKKKKKK...','.....KKKKKK.....','.......KK.......']
};
function sprite(kind,cls){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','pixel-sprite '+cls);svg.setAttribute('shape-rendering','crispEdges');const colors={W:'#fff0db',K:kind==='bat'?'#b89bea':'#21152e',O:'#ff953f',L:'#ffc078',G:'#b7d46d'};sprites[kind].forEach((row,y)=>[...row].forEach((c,x)=>{if(!colors[c])return;const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width','1');r.setAttribute('height','1');r.setAttribute('fill',colors[c]);svg.append(r);}));return svg;}
const controls=document.createElement('div');controls.className='season-controls';
const theme=document.createElement('button');theme.type='button';
const motion=document.createElement('button');motion.type='button';motion.textContent='Pausar animación';controls.append(motion);document.querySelector('header').prepend(controls);
const scene=document.createElement('div');scene.className='season-scene';scene.setAttribute('aria-hidden','true');
const label=document.createElement('div');label.className='season-label';label.innerHTML='<span>BRADESCARD / OCTUBRE</span><strong>Noche de cobertura.</strong><small>EDICIÓN HALLOWEEN · PIXEL 80s</small>';
const art=document.createElement('div');art.className='season-art';art.append(sprite('bat','pixel-bat'),sprite('ghost','pixel-ghost'),sprite('pumpkin','pixel-pumpkin'),sprite('skull','pixel-skull'));
const stars=document.createElement('div');stars.className='pixel-stars';scene.append(label,stars,art);document.querySelector('header').append(scene);
function apply(enabled){root.classList.toggle('halloween',enabled);scene.hidden=!enabled;motion.hidden=!enabled;theme.textContent=enabled?'Ver tema clásico':'Ver tema Halloween';theme.setAttribute('aria-pressed',String(enabled));}
let enabled=true;apply(enabled);
theme.addEventListener('click',()=>{enabled=!enabled;set('bradescard-theme',enabled?'halloween':'classic');apply(enabled);});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduced.matches||get('bradescard-animation')==='paused';
function pause(){root.classList.toggle('season-paused',paused);motion.textContent=paused?'Activar animación':'Pausar animación';motion.setAttribute('aria-pressed',String(paused));}pause();
motion.addEventListener('click',()=>{paused=!paused;set('bradescard-animation',paused?'paused':'running');pause();});
reduced.addEventListener('change',event=>{if(event.matches){paused=true;pause();}});
})();
