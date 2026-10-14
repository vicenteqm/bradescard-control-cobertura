'use strict';
(() => {
  const people=window.BRADESCARD_DATA?.activeReview;
  if(!Array.isArray(people))return;
  const section=document.createElement('section');section.id='conciliacion';
  section.innerHTML='<div class="section-title"><h2>Conciliación de activos</h2><span>EXCEL Y COBERTURA</span></div><article class="panel"><div class="panel-title"><div><h3>Personas activas y motivo de conteo</h3><p>Personal ACTIVO con puesto PROMOTOR, PROMOTOR DE CREDITO o SUBLIDER. La cobertura requiere una tienda OPERANDO en la base.</p></div></div><div class="hours-cards" id="active-totals"></div><div class="filters"><input type="search" id="active-search" placeholder="Buscar persona o tienda" aria-label="Buscar persona activa"><select id="active-scope" aria-label="Conteo de activos"><option value="excluded">No contabilizados</option><option value="all">Todos los activos elegibles</option><option value="counted">Contabilizados</option></select></div><p id="active-count"></p><div class="table-wrap"><table><thead><tr><th>Persona</th><th>Puesto</th><th>Tienda</th><th>Estatus de tienda</th><th>Conteo</th><th>Motivo</th></tr></thead><tbody id="active-rows"></tbody></table></div></article>';
  document.getElementById('tiendas').after(section);
  const nav=document.createElement('a');nav.href='#conciliacion';nav.textContent='▦ Conciliación';document.querySelector('nav').append(nav);
  const counted=people.filter(p=>p.counted).length;
  for(const [label,value] of [['Activos elegibles en Excel',people.length],['Contabilizados en cobertura',counted],['No contabilizados',people.length-counted]]){
    const card=document.createElement('div');card.className='hour-card';const title=document.createElement('span');title.textContent=label;const number=document.createElement('strong');number.textContent=value;card.append(title,number);document.getElementById('active-totals').append(card);
  }
  function render(){
    const scope=document.getElementById('active-scope').value,q=document.getElementById('active-search').value.trim().toLocaleLowerCase('es');
    const selected=people.filter(p=>(scope==='all'||(scope==='counted'?p.counted:!p.counted))&&(!q||[p.name,p.storeId,p.storeName].join(' ').toLocaleLowerCase('es').includes(q)));
    const body=document.getElementById('active-rows');body.replaceChildren();document.getElementById('active-count').textContent=selected.length+' personas en la consulta';
    for(const p of selected){const tr=document.createElement('tr');for(const value of [p.name,p.role,[p.storeId,p.storeName].filter(Boolean).join(' · '),p.storeStatus,p.counted?'Sí':'No',p.reason]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}
    if(!selected.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.textContent='No hay personas con estos filtros.';tr.append(td);body.append(tr);}
  }
  document.getElementById('active-search').addEventListener('input',render);document.getElementById('active-scope').addEventListener('change',render);render();
})();
