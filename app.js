/* app.js — main behaviour for the Anaesthetic Logbook PWA
   Expects localforage, PapaParse and Chart.js to be available as globals.
*/

// fallback safety: if localforage failed to load, provide a tiny wrapper that uses localStorage
if(typeof localforage === 'undefined'){
  console.warn('localforage not found — using lightweight localStorage fallback.');
  window.localforage = {
    _storagePrefix: 'anaesthetic-logbook-',
    config: function(){},
    async setItem(key, value){ localStorage.setItem(this._storagePrefix + key, JSON.stringify(value)); return value; },
    async getItem(key){ const v = localStorage.getItem(this._storagePrefix + key); return v ? JSON.parse(v) : null; },
    async keys(){ const ks=[]; for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.indexOf(this._storagePrefix)===0) ks.push(k.slice(this._storagePrefix.length)); } return ks; },
    async removeItem(key){ localStorage.removeItem(this._storagePrefix + key); },
    async clear(){ const toRemove=[]; for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.indexOf(this._storagePrefix)===0) toRemove.push(k); } toRemove.forEach(k=>localStorage.removeItem(k)); }
  };
}

localforage.config({name:'anaesthetic-logbook',storeName:'cases'});

const defaultSpecialties = ['ENT','General Surgery','Orthopaedics','Ophthalmology','Urology','Plastic','Neurosurgery','Maxillofacial','Obstetrics','Gynaecology','Cardiac','Thoracic','Vascular','Other'];
const defaultRegionals = ['Spinal','Epidural','Supraclavicular','Interscalene','Adductor canal','Femoral','Popliteal','Transversus abdominis plane (TAP)','Wound infiltration'];

// DOM refs
const specialtyEl = document.getElementById('specialty');
const regionalEl = document.getElementById('regional');
const regionalCustom = document.getElementById('regionalCustom');
const caseForm = document.getElementById('caseForm');
const casesList = document.getElementById('casesList');
const casesCount = document.getElementById('casesCount');

function populateDefaults(){
  defaultSpecialties.forEach(s=>{ const opt=document.createElement('option'); opt.textContent=s; specialtyEl.appendChild(opt); });
  defaultRegionals.forEach(r=>{ const opt=document.createElement('option'); opt.textContent=r; regionalEl.appendChild(opt); });
}
populateDefaults();

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function fmtDate(d){ return new Date(d).toISOString().slice(0,10); }

async function getAllCases(){ const keys = await localforage.keys(); const list = []; for(const k of keys){ const v = await localforage.getItem(k); if(v && v._id) list.push(v); }
  list.sort((a,b)=> (b.date||'').localeCompare(a.date||'') || (b._id||'').localeCompare(a._id||'')); return list; }

async function saveCase(obj){ if(!obj._id) obj._id = uid(); await localforage.setItem(obj._id, obj); }
async function deleteCase(id){ await localforage.removeItem(id); }
async function clearAll(){ await localforage.clear(); }

function readForm(){
  const procedures = Array.from(document.querySelectorAll('.proc')).filter(c=>c.checked).map(c=>c.value);
  const regionals = Array.from(regionalEl.selectedOptions).map(o=>o.value);
  if(regionalCustom.value.trim()) regionals.push(...regionalCustom.value.split(',').map(s=>s.trim()).filter(Boolean));
  return {
    date: document.getElementById('date').value,
    session: document.getElementById('session').value,
    specialty: document.getElementById('specialty').value,
    operation: document.getElementById('operation').value,
    priority: document.getElementById('priority').value,
    asa: document.getElementById('asa').value,
    age: document.getElementById('age').value,
    anaestheticType: document.getElementById('anaestheticType').value,
    airway: document.getElementById('airway').value,
    regional: regionals,
    procedures,
    teaching: document.getElementById('teaching').value,
    location: document.getElementById('location').value,
    incidents: document.getElementById('incidents').value
  };
}

async function renderList(){ const list = await getAllCases(); casesList.innerHTML=''; case
