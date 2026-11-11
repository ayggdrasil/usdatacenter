(function(root){
 'use strict';
 const levels={low:0,medium:1,high:2,unknown:-1};
 const actualStates={'tric-sparks-nv':'NV','colossus-tn':'TN/MS','aws-energy-way-nc':'NC'};
 const labels={en:{low:'Low',medium:'Moderate',high:'High',unknown:'Insufficient data'},ko:{low:'낮음',medium:'보통',high:'높음',unknown:'자료 부족'},ja:{low:'低',medium:'中',high:'高',unknown:'データ不足'}};
 function assess(project,engineering,policy){
  const state=engineering?.state||{};const actualState=actualStates[project.id]||project.state;
  const matched=actualState===project.state;
  const reserve=Number(state.gridReserveGW)*1000,availableWater=Number(state.usgsIndAvailMGD);
  const peak=Number(engineering?.effectivePeakMW),waterMGD=Number(engineering?.directMGD),stress=Number(state.waterStressScore);
  const powerRatio=matched&&reserve>0&&Number.isFinite(peak)?peak/reserve:null;
  const waterRatio=matched&&availableWater>0&&Number.isFinite(waterMGD)&&Number.isFinite(stress)?waterMGD/availableWater:null;
  const power=powerRatio===null?'unknown':powerRatio>=.5?'high':powerRatio>=.1?'medium':'low';
  const water=waterRatio===null?'unknown':waterMGD>=10||(waterRatio>=.1&&stress>=4)?'high':waterRatio>=.03||(stress>=4&&waterMGD>.5)?'medium':'low';
  const tag=matched&&policy?.stateCode===actualState?policy.stanceTag:null;
  const politics=tag==='MORATORIUM'?'high':['DISCLOSURE','BYOP'].includes(tag)?'medium':'unknown';
  const known=[power,water,politics];
  const overall=known.includes('high')?'high':known.includes('unknown')?'unknown':known.some(x=>x==='medium')?'medium':'low';
  return {actualState,matched,power,water,politics,overall,powerRatio,waterRatio,peak,waterMGD,stress,tag,cooling:project.cooling};
 }
 const n=value=>Number.isFinite(value)?String(Math.round(value*100)/100):'—';
 function describe(a,lang='en'){
  lang=labels[lang]?lang:'en';const l=labels[lang];
  if(!a.matched){return lang==='ko'?`${a.actualState} 기준 자료 부족 — 원본의 다른 주 대리값을 사용하지 않아 전력·용수·정책 영향을 판단할 수 없습니다.`:lang==='ja'?`${a.actualState}の基準データ不足 — 原本の別州の代替値を適用せず、電力・用水・政策への影響は判定保留。`:`Insufficient ${a.actualState} baseline — power, water and policy impacts remain unassessed rather than using another state's proxy.`;}
  const p=a.powerRatio===null?(lang==='ko'?'예비력 자료 없음':lang==='ja'?'予備力データなし':'reserve data unavailable'):`${n(a.peak)} MW / ${n((a.powerRatio||0)*100)}%`;
  const w=a.waterRatio===null?(lang==='ko'?'용수 기준값 없음':lang==='ja'?'用水基準値なし':'water baseline unavailable'):`${n(a.waterMGD)} MGD; ${n(a.stress)}/5`;
  const policy=lang==='ko'?{MORATORIUM:'원본에 조건부 유예 입장 기재',DISCLOSURE:'정보공개·비용전가 심사 압력',BYOP:'자체 전원·비용부담 조건'}:lang==='ja'?{MORATORIUM:'原本に条件付き停止の立場を記載',DISCLOSURE:'情報開示・費用転嫁の審査圧力',BYOP:'自前電源・費用負担の条件'}:{MORATORIUM:'conditional-pause position in source',DISCLOSURE:'disclosure/cost-shifting scrutiny',BYOP:'self-supply/cost-allocation conditions'};
  const unknown=lang==='ko'?'주별 입장 자료 없음':lang==='ja'?'州別の立場データなし':'no state-specific policy entry';
  if(lang==='ko')return `전력 ${l[a.power]} (${p}, 예비력 대비) · 용수 ${l[a.water]} (${w}, 직접용수·수자원 스트레스) · 정책 압력 ${l[a.politics]} (${policy[a.tag]||unknown})`;
  if(lang==='ja')return `電力影響 ${l[a.power]}（${p}、予備力比）・用水影響 ${l[a.water]}（${w}、直接用水・水ストレス）・政策圧力 ${l[a.politics]}（${policy[a.tag]||unknown}）`;
  return `Power impact ${l[a.power]} (${p} of stated reserve) · Water impact ${l[a.water]} (${w} direct use / water stress) · Policy pressure ${l[a.politics]} (${policy[a.tag]||unknown})`;
 }
 function render(project,engineering,policy,lang=root.atlasLanguage||'en'){
  lang=labels[lang]?lang:'en';const a=assess(project,engineering,policy);
  const color={high:'#fda4af',medium:'#fcd34d',low:'#6ee7b7',unknown:'#cbd5e1'}[a.overall];
  const title=lang==='ko'?'영향 심각도':lang==='ja'?'影響の深刻度':'Impact severity';
  return `<div data-atlas-ignore data-project-severity="${a.overall}" style="font-size:11px;line-height:1.65;font-weight:400;color:#cbd5e1;margin-top:6px;max-width:520px;white-space:normal"><strong style="color:${color}">${title}: ${labels[lang][a.overall]}</strong><br>${describe(a,lang)}</div>`;
 }
 const api={assess,describe,render};if(typeof module!=='undefined'&&module.exports)module.exports=api;else {
  root.AtlasSeverity=api;
  document.addEventListener('DOMContentLoaded',()=>{
   const lang=labels[root.atlasLanguage]?root.atlasLanguage:'en';
   const text={en:['How impact severity is estimated','Scenario screening from the supplied dataset. Power: High at ≥50% of stated state reserve; Moderate at ≥10%. Direct water: High at ≥10 MGD, or ≥10% of available water with stress ≥4/5; Moderate at ≥3%, or >0.5 MGD with stress ≥4/5. Policy pressure reflects listed positions: pause proposals = High; disclosure/self-supply conditions = Moderate; absent or mismatched state data = Insufficient data. These are screening thresholds, not calibrated forecasts or confirmation of enacted rules. Indirect power-generation water is excluded from the direct-water score.'],ko:['심각도 산정 기준','제공된 자료를 사용한 시나리오 선별 평가입니다. 전력은 주 예비력의 50% 이상이면 높음, 10% 이상이면 보통입니다. 직접용수는 10 MGD 이상이거나 여유 용수의 10% 이상이면서 스트레스 4/5 이상이면 높음, 3% 이상이거나 0.5 MGD 초과·스트레스 4/5 이상이면 보통입니다. 정책 압력은 원본에 기재된 입장 기준으로 유예 제안은 높음, 공개·자체전원 조건은 보통이며, 자료가 없거나 주가 맞지 않으면 자료 부족입니다. 이는 선별 기준이며 검증된 예측이나 법 시행 확정이 아닙니다. 발전 간접용수는 직접용수 점수에 포함하지 않습니다.'],ja:['深刻度の評価基準','提供データに基づくシナリオ評価です。電力は州予備力の50%以上で高、10%以上で中。直接用水は10MGD以上、または余剰用水の10%以上かつ水ストレス4/5以上で高、3%以上または0.5MGD超かつストレス4/5以上で中。政策圧力は原本に記載された立場に基づき、停止提案は高、開示・自前電源条件は中。州別データがない場合や州が一致しない場合はデータ不足です。校正済み予測や法施行の確認ではありません。発電による間接用水は直接用水スコアに含みません。']}[lang];
   const info=document.createElement('details');info.dataset.atlasIgnore='';info.style.cssText='font:12px/1.7 system-ui;padding:10px 14px;margin:12px 0;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#cbd5e1';
   const summary=document.createElement('summary');summary.textContent=text[0];const body=document.createElement('p');body.textContent=text[1];info.append(summary,body);
   document.querySelector('#projectTableBody')?.closest('table')?.parentElement?.before(info);
  });
 }
})(typeof window!=='undefined'?window:globalThis);
