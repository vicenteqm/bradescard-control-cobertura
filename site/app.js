'use strict';
const $=id=>document.getElementById(id), D=window.DATA;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?(a/b*100).toFixed(1)+'%':'—';
const sum=(rows,code)=>rows.reduce((n,r)=>n+(r.codes[code]||0),0);
const labels={A:'Asistencia',F:'Falta',I:'Incapacidad',D:'Descanso',B:'Baja',NA:'No aplica','SIN CAPTURA':'Sin captura'};
const colors={A:'#166195',F:'#c88b65',I:'#dfbd63',D:'#9dbf6d',B:'#a3ada0',NA:'#d6dfcf','SIN CAPTURA':'#b9c5b1'};
let view=[];
function option(el,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;el.append(o)}
[...new Set(D.stores.map(s=>s.state))].sort().forEach(v=>option($('state'),v,v));
[...new Set(D.daily.map(r=>r.role))].sort().forEach(v=>option($('role'),v,v));
function stores(){const old=$('store').value;$('store').innerHTML='<option value="">Todas las tiendas</option>';D.stores.filter(s=>!$('state').value||s.state===$('state').value).forEach(s=>option($('store'),s.id,s.id+' · '+s.name));if([...$('store').options].some(o=>o.value===old))$('store').value=old}
function applyMonth(period){
 $('from').value=period+'-01';
 const captured=D.daily.filter(row=>row.date.startsWith(period)&&Object.keys(row.codes).some(code=>code!=='SIN CAPTURA')).map(row=>row.date).sort();
 $('to').value=captured.at(-1)||period+'-'+new Date(+period.slice(0,4),+period.slice(5),0).getDate();
}
D.periods.forEach(period=>option($('attendanceMonth'),period,new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(new Date(period+'-15T12:00:00'))));
$('attendanceMonth').onchange=()=>{applyMonth($('attendanceMonth').value);render()};
function reset(){$('attendanceMonth').value=D.period;applyMonth(D.period);$('state').value='';$('role').value='';$('store').value='';stores();render()}
function render(){
 const selected=D.stores.filter(s=>(!$('state').value||s.state===$('state').value)&&(!$('store').value||s.id===$('store').value));
 const ids=new Set(selected.map(s=>s.id));
 view=D.daily.filter(r=>ids.has(r.store)&&r.date>=$('from').value&&r.date<=$('to').value&&(!$('role').value||r.role===$('role').value));
 const a=sum(view,'A'),f=sum(view,'F'),i=sum(view,'I');
 const staff=D.staff.filter(r=>ids.has(r.store)&&r.status==='ACTIVO'&&D.coverageRoles.includes(r.role)).reduce((n,r)=>n+r.count,0);
 const evaluated=selected.filter(s=>s.hasAttendance),complete=evaluated.length&&evaluated.every(s=>Number(D.targets[s.id])>0),target=evaluated.reduce((n,s)=>n+(Number(D.targets[s.id])||0),0);
 $('kpis').innerHTML=[['Cobertura · tiendas con datos',complete?pct(staff,target):'Sin datos',complete?staff+' personas activas / '+target+' plazas':'Sin asistencia para evaluar cobertura'],['Asistencia registrada',pct(a,a+f+i),a+' asistencias / '+(a+f+i)+' registros A + F + I'],['Faltas registradas',view.length?f:'—','Código F · periodo seleccionado'],['Incapacidades',view.length?i:'—','Días-persona con código I']].map(k=>`<div class="kpi"><p>${esc(k[0])}</p><strong>${esc(k[1])}</strong><small>${esc(k[2])}</small></div>`).join('');
 $('notice').textContent=$('from').value>$('to').value?'Revisa las fechas: el inicio es posterior al fin.':`${selected.length} tiendas · ${selected.reduce((n,s)=>n+(Number(D.targets[s.id])||0),0)} plazas autorizadas en la base. Cobertura evaluada en ${evaluated.length} de ${selected.length} tiendas; ${selected.length-evaluated.length} sin datos de asistencia. ${sum(view,'SIN CAPTURA')} registros sin captura.`;
 const dates=[...new Set(view.map(r=>r.date))].sort(); const daily=dates.map(d=>sum(view.filter(r=>r.date===d),'A')); const max=Math.max(1,...daily);
 if(!dates.length)$('trend').innerHTML='<div class="empty">Sin registros para estos filtros.</div>';
 else {const x=n=>35+n*565/Math.max(1,dates.length-1), y=n=>170-n/max*140;
 $('trend').innerHTML=`<svg viewBox="0 0 630 210" role="img" aria-label="Asistencias por día"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#97c9e9" stop-opacity=".4"/><stop offset="1" stop-color="#97c9e9" stop-opacity=".02"/></linearGradient></defs>${[0,.5,1].map(n=>`<line x1="35" y1="${y(max*n)}" x2="600" y2="${y(max*n)}" stroke="#e8f2f9"/><text x="15" y="${y(max*n)+4}" font-size="10" fill="#83907d">${(max*n).toFixed(1)}</text>`).join('')}<path d="M35,170 ${daily.map((v,n)=>`L${x(n)},${y(v)}`).join(' ')} L${x(daily.length-1)},170 Z" fill="url(#area)"/><polyline points="${daily.map((v,n)=>`${x(n)},${y(v)}`).join(' ')}" fill="none" stroke="#166195" stroke-width="2.5"/>${daily.map((v,n)=>`<circle cx="${x(n)}" cy="${y(v)}" r="3" fill="#166195"><title>${dates[n]}: ${v} asistencias</title></circle>`).join('')}${dates.map((d,n)=>n%Math.max(1,Math.ceil(dates.length/7))===0?`<text x="${x(n)}" y="197" text-anchor="middle" font-size="10" fill="#83907d">${d.slice(8)}/${d.slice(5,7)}</text>`:'').join('')}</svg>`;}
 const codes=[...new Set(view.flatMap(r=>Object.keys(r.codes)))].sort((a,b)=>sum(view,b)-sum(view,a)),total=codes.reduce((n,c)=>n+sum(view,c),0);
 $('distribution').innerHTML=codes.length?codes.map(c=>`<div class="distrow"><span>${esc(labels[c]||c)}</span><div class="track"><b style="width:${sum(view,c)/total*100}%;background:${colors[c]||'#8a9c7e'}"></b></div><strong>${sum(view,c)}</strong></div>`).join(''):'<div class="empty">Sin registros.</div>';
 $('storeCount').textContent=selected.length+' tiendas';
 $('rows').innerHTML=selected.map(s=>{const r=view.filter(v=>v.store===s.id),a=sum(r,'A'),f=sum(r,'F'),i=sum(r,'I'),active=D.staff.filter(v=>v.store===s.id&&v.status==='ACTIVO'&&D.coverageRoles.includes(v.role)).reduce((n,v)=>n+v.count,0),t=Number(D.targets[s.id]);return `<tr><td><strong>${esc(s.id+' · '+s.name)}</strong><small>${esc(s.city+' · '+s.state)}</small><small>${esc(s.status||'Sin estatus en base')}${s.hasAttendance?'':' · Sin datos de asistencia'}</small></td><td>${s.hasAttendance?active:'—'}</td><td>${t>0?t:'Pendiente'}<small>${s.promoters??'—'} promotores + ${s.subleaders??'—'} sublíder</small></td><td class="rate">${s.hasAttendance&&t>0?pct(active,t):'—'}</td><td>${r.length?a:'—'}</td><td>${r.length?f:'—'}</td><td>${r.length?i:'—'}</td><td class="rate">${pct(a,a+f+i)}</td></tr>`}).join('')||'<tr><td colspan="8">Sin tiendas para estos filtros.</td></tr>';
}
$('updated').textContent=new Date(D.updated).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});
$('source').textContent=[D.source,D.baseSource].filter(Boolean).join(' · ');
$('quality').textContent=`${D.quality.sheets} hojas consolidadas. ${D.quality.personDays} registros únicos persona-día. ${D.quality.overlapChanges} diferencias entre hojas resueltas por prioridad de la hoja más reciente.`;
$('notes').innerHTML=[...D.notes,'Perfiles de cobertura: '+D.coverageRoles.join(', ')+'.','Este enlace muestra información agrupada por tienda y perfil.'].map(n=>`<p>${esc(n)}</p>`).join('');
['from','to','store','role'].forEach(id=>$(id).addEventListener('change',render));$('state').addEventListener('change',()=>{stores();render()});$('reset').onclick=reset;
$('export').onclick=()=>{const rows=[['Fecha','Tienda','Perfil','Codigo','Cantidad'],...view.flatMap(r=>Object.entries(r.codes).map(([c,n])=>[r.date,r.store,r.role,c,n]))];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='bradescard-asistencias.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
reset();

function coverageMetrics(stores,staff){
 const operating=stores.filter(s=>s.status==='OPERANDO');
 const m={operating:operating.length,required:0,active:0,covered:0,vacancies:0,excess:0,pending:0,evaluated:0,profiles:[]};
 for(const [key,role,label] of [['promoters','PROMOTOR DE CREDITO','Promotores'],['subleaders','SUBLIDER','Sublíderes']]){
  const p={label,required:0,active:0,pending:0};
  for(const s of operating){
   const req=Number(s[key])||0;p.required+=req;m.required+=req;
   if(!s.hasAttendance){p.pending+=req;m.pending+=req;continue}
   const active=staff.filter(r=>r.store===s.id&&r.role===role&&r.status==='ACTIVO').reduce((n,r)=>n+r.count,0);
   p.active+=active;m.active+=active;m.covered+=Math.min(req,active);m.vacancies+=Math.max(0,req-active);m.excess+=Math.max(0,active-req);m.evaluated+=req;
  }
  m.profiles.push(p);
 }
 return m;
}
function covStores(){
 const previous=$('covStore').value;$('covStore').innerHTML='<option value="">Todas las tiendas</option>';
 D.stores.filter(s=>!$('covRegion').value||(s.region||'Sin región')===$('covRegion').value).forEach(s=>option($('covStore'),s.id,s.id+' · '+s.name));
 if([...$('covStore').options].some(o=>o.value===previous))$('covStore').value=previous;
}
function coverage(){
 const selected=D.stores.filter(s=>(!$('covRegion').value||(s.region||'Sin región')===$('covRegion').value)&&(!$('covStore').value||s.id===$('covStore').value));
 renderSchedules(selected);
 const m=coverageMetrics(selected,D.staff),partial=m.pending>0;
 $('covScope').textContent=`${selected.length} tiendas en la selección · ${m.operating} operando. KPI y gráficas calculados con estos filtros. Región corresponde a REGIÓN ADMINISTRATIVA en la base.`;
 $('covKpis').innerHTML=[['Tiendas operando',m.operating,'Tiendas operando en la selección'],['Plantilla requerida',m.required,'Promotores y sublíderes requeridos'],['Personal activo',m.evaluated?m.active:'—',partial?'Personal confirmado · información parcial':'Personal elegible de las tiendas operando'],['Vacantes',m.evaluated?m.vacancies:'—',partial?'Confirmadas en tiendas con datos · '+m.pending+' plazas por evaluar':'Faltantes por tienda y perfil; sin compensar excedentes']].map(([label,value,note])=>`<div class="kpi"><p>${label}</p><strong>${value}</strong><small>${note}</small></div>`).join('');
 const rate=m.evaluated?100*m.covered/m.evaluated:0;
 $('covGeneral').innerHTML=`<div class="donut-layout"><div class="donut" style="--pct:${rate}%" role="img" aria-label="${esc(pct(m.covered,m.evaluated))} de cobertura en plazas evaluadas"><div><strong>${pct(m.covered,m.evaluated)}</strong><span>${partial?'COBERTURA PARCIAL':'COBERTURA'}</span></div></div><dl class="covstats"><div><dt>Plazas cubiertas</dt><dd>${m.covered}</dd></div><div><dt>Vacantes confirmadas</dt><dd>${m.vacancies}</dd></div><div><dt>Excedentes por tienda y perfil</dt><dd>${m.excess}</dd></div><div><dt>Plazas sin datos de asistencia</dt><dd>${m.pending}</dd></div></dl></div><p class="covnote">${m.evaluated} de ${m.required} plazas evaluadas.${partial?' El porcentaje excluye las plazas sin datos.':''}</p>`;
 $('covProfiles').innerHTML=m.profiles.map(p=>{const max=Math.max(1,p.required,p.active);return `<div class="profile"><h3>${p.label}</h3><div class="profilebar"><span>Requeridos</span><div><i style="width:${100*p.required/max}%"></i></div><b>${p.required}</b></div><div class="profilebar actual"><span>Activos</span><div><i style="width:${100*p.active/max}%"></i></div><b>${m.evaluated?p.active:'—'}</b></div>${p.pending?`<small>${p.pending} plazas requeridas sin datos de asistencia.</small>`:''}</div>`}).join('');
}
[...new Set(D.stores.map(s=>s.region||'Sin región'))].sort().forEach(r=>option($('covRegion'),r,r));
$('covRegion').onchange=()=>{covStores();coverage()};$('covStore').onchange=coverage;
$('covReset').onclick=()=>{$('covRegion').value='';$('covStore').value='';covStores();coverage()};
covStores();coverage();

function scheduleForStore(store, staff) {
 const known=Boolean(store.hasAttendance);
 const active=role=>staff.filter(p=>p.store===store.id&&p.role===role&&p.status==='ACTIVO').reduce((n,p)=>n+p.count,0);
 const sub=known?active('SUBLIDER'):0, pro=known?active('PROMOTOR DE CREDITO'):0;
 const mat=Math.min(1,pro),ves=Math.min(1,Math.max(0,pro-1));
 return {known, sub:Math.min(1,sub),mat,ves,missSub:Math.max(0,1-sub),missMat:1-mat,missVes:1-ves,extra:Math.max(0,(store.promoters||0)-2)};
}
function renderSchedules(selected){
 const rows=selected.map(store=>({store,v:scheduleForStore(store,D.staff)}));
 const known=rows.filter(r=>r.v.known);let missing=known.reduce((n,r)=>n+r.v.missSub+r.v.missMat+r.v.missVes,0);
 $('scheduleScope').textContent=`${selected.length} tiendas OPERANDO · ${known.length} con registros de plantilla · ${selected.length-known.length} sin datos. Turnos de referencia: no equivalen a asistencia real.`;
 $('scheduleSummary').innerHTML=`<div><span>Faltantes en turnos · confirmados</span><strong>${missing}</strong><small>Solo tiendas con registro</small></div><div><span>Tiendas sin datos</span><strong>${selected.length-known.length}</strong><small>No se imputan faltantes</small></div><div><span>Tiendas con turno incompleto</span><strong>${known.filter(r=>r.v.missSub+r.v.missMat+r.v.missVes>0).length}</strong><small>Asignación estimada</small></div>`;
 $('scheduleRows').innerHTML=rows.map(({store:s,v})=>`<tr><td><strong>${esc(s.id+' · '+s.name)}</strong><small>${esc(s.city+' · '+s.region)}</small></td><td>${v.known?v.sub+'/1':'Sin datos'}<small>11:00–20:00</small></td><td>${v.known?v.mat+'/1 mat · '+v.ves+'/1 ves':'Sin datos'}<small>11:00–17:00 · 14:00–20:00${v.extra?' · '+v.extra+' plaza(s) adicional(es) de base sin turno':''}</small></td><td class="schedule-gap">${v.known?v.missSub+v.missMat:'—'}</td><td class="schedule-gap">${v.known?v.missSub+v.missMat+v.missVes:'—'}</td><td>${!v.known?'Sin datos':v.sub+v.mat+v.ves===0?'11:00–20:00':v.sub+v.mat===0?'11:00–14:00':v.sub+v.ves===0?'17:00–20:00':'Sin cierre total'}</td></tr>`).join('')||'<tr><td colspan="6">Sin tiendas para estos filtros.</td></tr>';
}
