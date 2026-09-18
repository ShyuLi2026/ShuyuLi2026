const $=id=>document.getElementById(id);
let runtimePromise;
async function runtime(){
 if(!runtimePromise)runtimePromise=(async()=>{
  $('status').textContent='正在加载 Python 引擎，首次访问可能需要几十秒…';
  if(!window.loadPyodide)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';s.onload=resolve;s.onerror=()=>reject(new Error('引擎下载失败，请检查网络后重试'));document.head.append(s)});
  const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
  const [zip,code]=await Promise.all([fetch('lunar.zip'),fetch('engine.py')]);
  if(!zip.ok||!code.ok)throw new Error('历法文件加载失败，请重试');
  py.unpackArchive(await zip.arrayBuffer(),'zip');await py.runPythonAsync(await code.text());return py;
 })().catch(e=>{runtimePromise=null;throw e});
 return runtimePromise;
}
const colors={'木':'#5e8067','火':'#b46451','土':'#a38c55','金':'#7c8795','水':'#538491'};
function render(r){
 $('empty').hidden=true;$('output').hidden=false;$('badge').textContent='已排盘';
 $('birth').textContent=`北京时间 ${r.solar} · 农历 ${r.lunar} · ${r.sect===2?'0 点':'23 点'}换日`;
 const rows=[['十神',p=>p.ganGod,'god'],['天干',p=>p.gz[0],'big'],['地支',p=>p.gz[1],'big'],['五行',p=>p.wuxing,''],['藏干',p=>p.hidden.join(' · '),'hidden-gan'],['藏干十神',p=>p.zhiGod.join(' / '),'hidden-gan'],['纳音',p=>p.nayin,''],['十二长生',p=>p.stage,''],['旬空',p=>p.void,'']];
 $('rows').replaceChildren(...rows.map(([label,fn,cls])=>{const tr=document.createElement('tr');const th=document.createElement('td');th.textContent=label;tr.append(th);r.pillars.forEach(p=>{const td=document.createElement('td');td.className=cls;td.textContent=fn(p);if(cls==='big')td.style.color=colors[p.wuxing[label==='天干'?0:1]];tr.append(td)});return tr}));
 $('bars').replaceChildren(...Object.entries(r.counts).map(([k,n])=>{const el=document.createElement('div');el.className='element';el.style.setProperty('--color',colors[k]);el.innerHTML=`${k}<b>${n}</b><div class="track"><i style="width:${n/8*100}%"></i></div>`;return el}));
 $('prev').textContent=r.prev;$('next').textContent=r.next;
}
async function calculate(p){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!/^\d{2}:\d{2}(:\d{2})?$/.test(p.time))throw new Error('请填写有效的日期和时间');
 $('submit').disabled=true;$('badge').textContent='计算中';
 try{const py=await runtime();py.globals.set('request_json',JSON.stringify(p));const r=JSON.parse(await py.runPythonAsync('calculate(request_json)'));render(r);$('status').textContent='排盘完成 · 本地 Python 计算';return r}
 catch(e){$('badge').textContent='未完成';$('status').textContent='排盘失败：请核对日期与时间，或检查网络后重试。';throw e}
 finally{$('submit').disabled=false}
}
$('form').addEventListener('submit',async e=>{e.preventDefault();try{await calculate({date:$('date').value,time:$('time').value,sect:Number($('sect').value),offset:Number($('offset').value),dst:$('dst').checked})}catch(e){console.error(e)}});
$('form').addEventListener('input',()=>{if(!$('output').hidden){$('badge').textContent='信息已修改';$('status').textContent='下方仍是上次结果，请重新生成命盘。'}});
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'calculate_bazi',description:'使用北京时间口径生成并显示四柱八字命盘。',inputSchema:{type:'object',properties:{date:{type:'string',description:'公历 YYYY-MM-DD，1901—2099'},time:{type:'string',description:'HH:MM:SS'},sect:{type:'integer',enum:[1,2]},offset:{type:'number',minimum:-12,maximum:14},dst:{type:'boolean'}},required:['date','time'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(p){const r=await calculate(p);$('date').value=p.date;$('time').value=p.time;$('sect').value=p.sect??2;$('offset').value=p.offset??8;$('dst').checked=!!p.dst;return r}})).catch(console.warn)}catch(e){console.warn(e)}}
