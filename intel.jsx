import { useState, useEffect, useRef, useCallback } from "react";

const G = {
  bg:"#0b0d10", surface:"#111418", surfaceHigh:"#161b22",
  border:"#1e2530", borderHigh:"#2a3442",
  accent:"#c9f542", accentDim:"#a3c934",
  text:"#d8e4f0", textDim:"#4e5e72", textMid:"#7a8fa8",
  red:"#e84545",    redDim:"rgba(232,69,69,0.1)",    redBorder:"rgba(232,69,69,0.2)",
  green:"#2fd47a",  greenDim:"rgba(47,212,122,0.08)", greenBorder:"rgba(47,212,122,0.2)",
  orange:"#f5a523", orangeDim:"rgba(245,165,35,0.08)",orangeBorder:"rgba(245,165,35,0.2)",
  blue:"#4a9eff",   blueDim:"rgba(74,158,255,0.08)",  blueBorder:"rgba(74,158,255,0.2)",
  purple:"#a78bfa", purpleDim:"rgba(167,139,250,0.08)",purpleBorder:"rgba(167,139,250,0.2)",
};

// ── COMPETITOR STORAGE & HISTORY SYSTEM ───────────────────────────────────────
const CompetitorDB = {
  save(bizName, data) {
    const stored = this.getAll();
    const timestamp = new Date().toISOString();
    
    stored[bizName] = {
      ...data,
      lastAnalyzed: timestamp,
      history: stored[bizName]?.history || []
    };
    
    stored[bizName].history.push({
      timestamp,
      snapshot: JSON.parse(JSON.stringify(data))
    });
    
    if (stored[bizName].history.length > 12) {
      stored[bizName].history = stored[bizName].history.slice(-12);
    }
    
    localStorage.setItem('horecaintel_competitors', JSON.stringify(stored));
  },
  
  getAll() {
    const data = localStorage.getItem('horecaintel_competitors');
    return data ? JSON.parse(data) : {};
  },
  
  get(bizName) {
    return this.getAll()[bizName] || null;
  },
  
  delete(bizName) {
    const stored = this.getAll();
    delete stored[bizName];
    localStorage.setItem('horecaintel_competitors', JSON.stringify(stored));
  },
  
  getComparisonList() {
    const all = this.getAll();
    return Object.entries(all)
      .filter(([_, data]) => data.inComparison)
      .map(([name, data]) => ({ name, ...data }));
  },
  
  toggleComparison(bizName) {
    const stored = this.getAll();
    if (stored[bizName]) {
      stored[bizName].inComparison = !stored[bizName].inComparison;
      localStorage.setItem('horecaintel_competitors', JSON.stringify(stored));
    }
  },
  
  detectChanges(bizName, newData) {
    const competitor = this.get(bizName);
    if (!competitor || competitor.history.length === 0) return null;
    
    const lastSnapshot = competitor.history[competitor.history.length - 1].snapshot;
    const changes = [];
    
    if (lastSnapshot.menuData?.avgPrice !== newData.menuData?.avgPrice) {
      const old = lastSnapshot.menuData?.avgPrice || 0;
      const curr = newData.menuData?.avgPrice || 0;
      const pct = old > 0 ? ((curr - old) / old * 100).toFixed(1) : 0;
      changes.push({
        type: 'price',
        field: 'Gemiddelde prijs',
        old: `€${old}`,
        new: `€${curr}`,
        change: pct > 0 ? `+${pct}%` : `${pct}%`,
        severity: Math.abs(pct) > 10 ? 'high' : 'medium'
      });
    }
    
    if (lastSnapshot.place?.rating !== newData.place?.rating) {
      changes.push({
        type: 'rating',
        field: 'Google Rating',
        old: lastSnapshot.place?.rating?.toFixed(1) || 'N/A',
        new: newData.place?.rating?.toFixed(1) || 'N/A',
        change: ((newData.place?.rating || 0) - (lastSnapshot.place?.rating || 0)).toFixed(1),
        severity: 'medium'
      });
    }
    
    if (lastSnapshot.menuData?.threatScore !== newData.menuData?.threatScore) {
      changes.push({
        type: 'threat',
        field: 'Threat Score',
        old: `${lastSnapshot.menuData?.threatScore || 0}/10`,
        new: `${newData.menuData?.threatScore || 0}/10`,
        change: (newData.menuData?.threatScore || 0) - (lastSnapshot.menuData?.threatScore || 0),
        severity: 'high'
      });
    }
    
    return changes.length > 0 ? changes : null;
  }
};

const OpportunityScorer = {
  scoreWeakness(weakness, context) {
    let score = 5;
    
    if (weakness.toLowerCase().includes('lunch')) score += 2;
    if (weakness.toLowerCase().includes('vegan') || weakness.toLowerCase().includes('vegetar')) score += 1.5;
    if (weakness.toLowerCase().includes('delivery') || weakness.toLowerCase().includes('takeaway')) score += 2;
    if (weakness.toLowerCase().includes('kids menu') || weakness.toLowerCase().includes('familie')) score += 1;
    if (weakness.toLowerCase().includes('openingstijden') || weakness.toLowerCase().includes('hours')) score += 1;
    if (weakness.toLowerCase().includes('website') || weakness.toLowerCase().includes('social media')) score += 0.5;
    if (weakness.toLowerCase().includes('geen') || weakness.toLowerCase().includes('ontbreekt')) score += 1;
    if (weakness.toLowerCase().includes('service') || weakness.toLowerCase().includes('wacht')) score += 1.5;
    
    if (context.threatScore && context.threatScore < 5) score += 1;
    if (context.threatScore && context.threatScore > 7) score -= 0.5;
    
    return Math.min(10, Math.max(0, score));
  },
  
  scoreAll(competitor) {
    if (!competitor.menuData?.weaknesses) return [];
    
    const weaknesses = typeof competitor.menuData.weaknesses === 'string'
      ? competitor.menuData.weaknesses.split('\n').filter(w => w.trim().length > 10)
      : competitor.menuData.weaknesses;
    
    const opportunities = typeof competitor.menuData.exploitation === 'string'
      ? competitor.menuData.exploitation.split('\n').filter(o => o.includes('→'))
      : competitor.opportunities || [];
    
    const scored = weaknesses.map((weakness, i) => {
      const score = this.scoreWeakness(weakness, {
        threatScore: competitor.menuData?.threatScore
      });
      
      const opportunity = opportunities[i] || '';
      const action = opportunity.includes('→') ? opportunity.split('→')[1]?.trim() : '';
      
      return {
        weakness: weakness.replace(/^[-•*]\s*/, '').trim(),
        action,
        score,
        difficulty: score > 7 ? 'Easy' : score > 4 ? 'Medium' : 'Hard',
        impact: score > 7 ? 'High' : score > 4 ? 'Medium' : 'Low'
      };
    });
    
    return scored.sort((a, b) => b.score - a.score);
  }
};

const HINTS = [
  { name:"Restaurant De Kas Amsterdam",  type:"Restaurant" },
  { name:"Hotel V Nesplein Amsterdam",   type:"Hotel" },
  { name:"Cafe de Jaren Amsterdam",      type:"Cafe" },
  { name:"The Dylan Amsterdam",          type:"Boutique Hotel" },
  { name:"De Maassilo Rotterdam",        type:"Restaurant" },
  { name:"De Librije Zwolle",           type:"Michelin Restaurant" },
  { name:"Hotel Haarhuis Arnhem",        type:"Hotel" },
  { name:"Blauw Utrecht",               type:"Restaurant" },
  { name:"Leidse Hout Leiden",          type:"Restaurant" },
  { name:"Escape Club Amsterdam",        type:"Nachtclub" },
];

const LOAD_STEPS = [
  "Google Places Text Search",
  "Google Place Details ophalen",
  "Reviews en openingstijden laden",
  "KVK Handelsregister raadplegen",
  "Vergunningendatabases doorzoeken",
  "Hunter.io domein scannen",
  "AI Intel rapport opstarten",
];

const sc = (s,max=5) => s/max>=0.88?G.green:s/max>=0.70?G.orange:G.red;

function Spin({color}){
  return <div style={{width:12,height:12,border:`2px solid ${(color||G.purple)}33`,borderTopColor:color||G.purple,borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>;
}

function Exp({title,meta,badge,bs="ok",children,open:def=false}){
  const [o,setO]=useState(def);
  return (
    <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",cursor:"pointer",userSelect:"none"}} onClick={()=>setO(x=>!x)}>
        {badge&&<span style={{display:"inline-flex",alignItems:"center",borderRadius:3,padding:"2px 7px",fontFamily:"IBM Plex Mono",fontSize:9,fontWeight:600,...badgeStyle(bs)}}>{badge}</span>}
        <span style={{flex:1,fontSize:12.5,fontWeight:500}}>{title}</span>
        {meta&&<span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:G.textDim}}>{meta}</span>}
        <span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:G.textDim,transition:"transform 0.2s",transform:o?"rotate(90deg)":"none"}}>{">"}</span>
      </div>
      {o&&<div style={{padding:"0 16px 14px",borderTop:`1px solid ${G.border}`}}><div style={{paddingTop:12}}>{children}</div></div>}
    </div>
  );
}

function badgeStyle(bs){
  const m={ok:{background:G.greenDim,border:`1px solid ${G.greenBorder}`,color:G.green},warn:{background:G.orangeDim,border:`1px solid ${G.orangeBorder}`,color:G.orange},bad:{background:G.redDim,border:`1px solid ${G.redBorder}`,color:G.red},info:{background:G.blueDim,border:`1px solid ${G.blueBorder}`,color:G.blue}};
  return m[bs]||m.ok;
}

function KVRow({k,v,vs}){
  if(!v&&v!==0)return null;
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"6px 0",borderBottom:`1px solid ${G.border}`,gap:12}}><span style={{color:G.textDim,fontSize:11.5,flexShrink:0,minWidth:100}}>{k}</span><span style={{color:G.text,fontSize:11.5,textAlign:"right",fontFamily:"IBM Plex Mono",wordBreak:"break-all",...(vs||{})}}>{String(v)}</span></div>;
}

function NoKey({label,url}){
  return <div style={{textAlign:"center",padding:"36px 24px",color:G.textDim}}><div style={{fontFamily:"Bebas Neue",fontSize:20,color:G.textMid,marginBottom:8,letterSpacing:1}}>Geen API Sleutel</div><div style={{fontSize:11.5,lineHeight:1.7,maxWidth:340,margin:"0 auto"}}>{label} sleutel ontbreekt.{url&&<> Aanvragen via <a href={url} target="_blank" rel="noreferrer" style={{color:G.blue}}>{url.replace(/^https?:\/\//,"")}</a>.</>} Voeg toe via <strong>Instellingen</strong>.</div></div>;
}

function NoCors({url}){
  return <div>
    <div style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 12px",borderRadius:4,marginBottom:10,fontSize:11.5,lineHeight:1.5,background:G.orangeDim,border:`1px solid ${G.orangeBorder}`,color:G.orange}}><span style={{fontFamily:"IBM Plex Mono",fontSize:10,flexShrink:0}}>!</span>Browser CORS blokkade — voeg proxy URL toe in Instellingen.</div>
    <div style={{background:G.bg,border:`1px solid ${G.border}`,borderRadius:4,padding:"12px 14px",fontFamily:"IBM Plex Mono",fontSize:10,color:G.textMid,lineHeight:1.9,overflowX:"auto",marginTop:10}}>
      <div><span style={{color:G.textDim}}>{"// api/proxy.js  (Vercel)"}</span></div>
      <div><span style={{color:G.accent}}>export default</span> <span style={{color:G.accent}}>async</span> {"(req, res) => {"}</div>
      <div>{"  "}<span style={{color:G.accent}}>const</span> {"{ url } = req.query;"}</div>
      <div>{"  "}<span style={{color:G.accent}}>const</span> r = <span style={{color:G.accent}}>await</span> fetch(decodeURIComponent(url));</div>
      <div>{"  "}res.setHeader(<span style={{color:G.green}}>{"'Access-Control-Allow-Origin'"}</span>, <span style={{color:G.green}}>{"'*'"}</span>);</div>
      <div>{"  "}res.send(<span style={{color:G.accent}}>await</span> r.text());</div>
      <div>{"}"}</div>
      {url&&<div style={{marginTop:8,color:G.textDim}}>Target: <a href={url} target="_blank" rel="noreferrer" style={{color:G.blue,wordBreak:"break-all"}}>{url}</a></div>}
    </div>
  </div>;
}

function Alert({type="info",children}){
  const styles={info:{bg:G.blueDim,border:G.blueBorder,color:G.blue,sym:"i"},warn:{bg:G.orangeDim,border:G.orangeBorder,color:G.orange,sym:"!"},ok:{bg:G.greenDim,border:G.greenBorder,color:G.green,sym:"+"},bad:{bg:G.redDim,border:G.redBorder,color:G.red,sym:"!"}};
  const s=styles[type]||styles.info;
  return <div style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 12px",borderRadius:4,marginBottom:8,fontSize:11.5,lineHeight:1.5,background:s.bg,border:`1px solid ${s.border}`,color:s.color}}><span style={{fontFamily:"IBM Plex Mono",fontSize:10,flexShrink:0,marginTop:1}}>{s.sym}</span><span>{children}</span></div>;
}

function SourceBadge({st}){
  const m={live:{bg:G.greenDim,border:G.greenBorder,color:G.green,label:"LIVE"},cors:{bg:G.orangeDim,border:G.orangeBorder,color:G.orange,label:"CORS"},miss:{bg:G.surfaceHigh,border:G.border,color:G.textDim,label:"GEEN KEY"},err:{bg:G.redDim,border:G.redBorder,color:G.red,label:"FOUT"},loading:{bg:G.blueDim,border:G.blueBorder,color:G.blue,label:"..."}};
  const s=m[st]||m.miss;
  return <span style={{fontFamily:"IBM Plex Mono",fontSize:8,padding:"2px 6px",borderRadius:3,background:s.bg,border:`1px solid ${s.border}`,color:s.color}}>{s.label}</span>;
}

function PBarRow({name,score,max=5,count}){
  return <div style={{display:"flex",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${G.border}`,gap:12}}>
    <span style={{fontSize:12,width:90,flexShrink:0}}>{name}</span>
    <div style={{flex:1,height:3,background:G.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:sc(score,max),width:`${(score/max)*100}%`,transition:"width 0.8s ease"}}/></div>
    <span style={{fontFamily:"Bebas Neue",fontSize:22,width:36,textAlign:"right",color:sc(score,max)}}>{score}</span>
    {count!==undefined&&<span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:G.textDim,width:80,textAlign:"right"}}>{count}</span>}
  </div>;
}

// This file is getting very long. Due to character limits, I'll provide this in parts.
// Would you like me to:
// 1. Create a GitHub Gist with the complete code
// 2. Split it into multiple messages
// 3. Provide just the core components you need to copy

Let me know which approach works best for you!
