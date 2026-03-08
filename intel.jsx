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

// ── AI PANEL ──────────────────────────────────────────────────────────────────
function AIPanel({apiKey,bizName,place,kvk}){
  const [st,setSt]=useState("idle");
  const [sections,setSecs]=useState([]);
  const [raw,setRaw]=useState("");

  const go=async()=>{
    if(!apiKey){setSt("no_key");return;}
    setSt("loading");setRaw("");setSecs([]);
    const ctx=[
      place?`Naam: ${place.displayName?.text}, Adres: ${place.formattedAddress}, Rating: ${place.rating} (${place.userRatingCount} reviews), Status: ${place.businessStatus}, Website: ${place.websiteUri||"onbekend"}`:"",
      kvk?`KVK: ${kvk.naam}, Nr: ${kvk.kvkNummer}, SBI: ${kvk.sbiCode}, Rechtsvorm: ${kvk.rechtsvorm}, Actief: ${kvk.indActief}`:"",
    ].filter(Boolean).join("\n");
    const prompt=`Je bent een Nederlandse horeca-intelligentie analist. Schrijf een beknopt intel rapport over: ${bizName}\n\n${ctx?"Live data:\n"+ctx:"Geen API data — baseer op publieke kennis."}\n\nGebruik precies 4 secties met **Sectienaam** headers:\n**Eigenaren & Achtergrond**\n**Reputatieanalyse**\n**Zakelijke Risicos**\n**Kansen & Signalen**\n\nMax 90 woorden per sectie. Specifiek, analytisch, actionabel. Nederlands.`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,stream:true,messages:[{role:"user",content:prompt}]})});
      const reader=res.body.getReader();const dec=new TextDecoder();let full="";
      while(true){const{done,value}=await reader.read();if(done)break;for(const line of dec.decode(value).split("\n").filter(l=>l.startsWith("data:"))){try{const d=JSON.parse(line.slice(5));if(d.delta?.text){full+=d.delta.text;setRaw(full);}}catch{}}}
      const rx=/\*\*([^*]+)\*\*\s*([\s\S]*?)(?=\*\*|$)/g;const out=[];let m;
      while((m=rx.exec(full))!==null)out.push({title:m[1].trim(),body:m[2].trim()});
      setSecs(out.length?out:[{title:"Intel",body:full}]);setSt("done");
    }catch{setSt("error");}
  };

  return(
    <div style={{background:G.surface,border:`1px solid ${G.purpleBorder}`,borderRadius:5,padding:"16px 18px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontFamily:"Bebas Neue",fontSize:18,letterSpacing:1.5,color:G.purple}}>AI Intel</span>
        <span style={{fontFamily:"IBM Plex Mono",fontSize:8.5,padding:"2px 7px",borderRadius:3,background:G.purpleDim,border:`1px solid ${G.purpleBorder}`,color:G.purple}}>Claude Sonnet</span>
        {st==="idle"&&<button onClick={go} style={{marginLeft:"auto",background:G.purpleDim,border:`1px solid ${G.purpleBorder}`,color:G.purple,padding:"5px 14px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>Genereer</button>}
        {st==="done"&&<button onClick={()=>{setSt("idle");setSecs([]);setRaw("");}} style={{marginLeft:"auto",background:"none",border:`1px solid ${G.border}`,color:G.textDim,padding:"4px 11px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9}}>Opnieuw</button>}
      </div>
      {st==="idle"&&<div style={{fontFamily:"IBM Plex Mono",fontSize:10.5,color:G.textDim,lineHeight:1.7}}>Genereert OSINT analyse op basis van live data. Vereist Anthropic API sleutel.</div>}
      {st==="no_key"&&<Alert type="warn">Anthropic API sleutel ontbreekt — voeg toe in Instellingen.</Alert>}
      {st==="loading"&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,fontFamily:"IBM Plex Mono",fontSize:10.5,color:G.purple}}><Spin/>Rapport genereren...</div>{raw&&<div style={{fontSize:11.5,lineHeight:1.75,color:G.text,whiteSpace:"pre-wrap"}}>{raw}<span style={{display:"inline-block",width:2,height:12,background:G.purple,animation:"blink 0.8s step-end infinite",marginLeft:2,verticalAlign:"middle"}}/></div>}</div>}
      {st==="error"&&<Alert type="bad">API fout — controleer uw Anthropic sleutel.</Alert>}
      {st==="done"&&sections.map((s,i)=>(
        <div key={i} style={{marginBottom:i<sections.length-1?12:0,paddingBottom:i<sections.length-1?12:0,borderBottom:i<sections.length-1?`1px solid ${G.border}`:"none"}}>
          <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2,textTransform:"uppercase",color:G.purple,marginBottom:7}}>{s.title}</div>
          <div style={{fontSize:11.5,lineHeight:1.75,color:G.text}}>{s.body}</div>
        </div>
      ))}
    </div>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab({keys,bizName,place,kvk}){
  return(
    <div>
      <AIPanel apiKey={keys.anthropicKey} bizName={bizName} place={place} kvk={kvk}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim}}>Google Business</div>
            <SourceBadge st={place?"live":"miss"}/>
          </div>
          {place?<>
            <KVRow k="Naam" v={place.displayName?.text}/>
            <KVRow k="Adres" v={place.formattedAddress}/>
            <KVRow k="Status" v={place.businessStatus} vs={{color:place.businessStatus==="OPERATIONAL"?G.green:G.orange}}/>
            <KVRow k="Rating" v={place.rating?`${place.rating} / 5  (${place.userRatingCount?.toLocaleString("nl-NL")} reviews)`:null} vs={{color:sc(place.rating||0)}}/>
            <KVRow k="Website" v={place.websiteUri?.replace(/^https?:\/\//,"").slice(0,35)}/>
            <KVRow k="Telefoon" v={place.nationalPhoneNumber}/>
          </>:<NoKey label="Google Places API" url="https://console.cloud.google.com"/>}
        </div>
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim}}>KVK Register</div>
            <SourceBadge st={kvk?"live":"miss"}/>
          </div>
          {kvk?<>
            <KVRow k="Naam" v={kvk.naam}/>
            <KVRow k="KVK-nummer" v={kvk.kvkNummer}/>
            <KVRow k="SBI-code" v={kvk.sbiCode}/>
            <KVRow k="Rechtsvorm" v={kvk.rechtsvorm}/>
            <KVRow k="Status" v={kvk.indActief?"Actief":"Opgeheven"} vs={{color:kvk.indActief?G.green:G.red}}/>
          </>:<NoKey label="KVK API" url="https://developers.kvk.nl"/>}
        </div>
      </div>
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px"}}>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,marginBottom:12}}>API Sleutels Status</div>
        {[{k:"anthropicKey",label:"Anthropic AI Intel",url:"https://console.anthropic.com"},{k:"googleKey",label:"Google Places",url:"https://console.cloud.google.com"},{k:"kvkKey",label:"KVK Handelsregister",url:"https://developers.kvk.nl"},{k:"hunterKey",label:"Hunter.io Emails",url:"https://hunter.io"},{k:"proxyUrl",label:"Proxy URL (CORS)",url:null}].map(({k,label,url})=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"6px 0",borderBottom:`1px solid ${G.border}`,gap:12}}>
            <span style={{color:G.textDim,fontSize:11.5}}>{label}</span>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:keys[k]?G.green:G.border,display:"inline-block"}}/>
              <span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,color:keys[k]?G.green:G.textDim}}>{keys[k]?"Geconfigureerd":"Ontbreekt"}</span>
              {!keys[k]&&url&&<a href={url} target="_blank" rel="noreferrer" style={{fontFamily:"IBM Plex Mono",fontSize:8.5,color:G.blue}}>aanvragen</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BEDRIJF TAB ───────────────────────────────────────────────────────────────
function BedrijfTab({keys,bizName,place,kvk,onKVKFetched}){
  const [kvkSt,setKSt]=useState(kvk?"done":"idle");
  const [kvkData,setKD]=useState(kvk);
  const [kvkUrl,setKU]=useState(null);

  const fetchKVK=async()=>{
    if(!keys.kvkKey){setKSt("no_key");return;}
    setKSt("loading");
    const zoekUrl=`https://api.kvk.nl/api/v2/zoeken?naam=${encodeURIComponent(bizName)}&pagina=1&resultatenperpagina=3`;
    const pUrl=keys.proxyUrl?`${keys.proxyUrl.replace(/\/$/,"")}?url=${encodeURIComponent(zoekUrl)}`:zoekUrl;
    setKU(zoekUrl);
    try{
      const res=await fetch(pUrl,{headers:{apikey:keys.kvkKey}});
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const json=await res.json();
      const first=json.resultaten?.[0];
      if(!first){setKSt("empty");return;}
      const bpUrl=`https://api.kvk.nl/api/v1/basisprofielen/${first.kvkNummer}`;
      const bpProxy=keys.proxyUrl?`${keys.proxyUrl.replace(/\/$/,"")}?url=${encodeURIComponent(bpUrl)}`:bpUrl;
      const bp=await fetch(bpProxy,{headers:{apikey:keys.kvkKey}});
      const bpJson=await bp.json();
      const merged={...first,...bpJson};
      setKD(merged);setKSt("done");onKVKFetched&&onKVKFetched(merged);
    }catch(e){setKSt(e.message.includes("fetch")||e.message.includes("Failed")?"cors":"error");}
  };

  const panel=(title,badge,children)=>(
    <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim}}>{title}</div>
        {badge}
      </div>
      {children}
    </div>
  );

  return(
    <div>
      {panel("Google Business — Primaire Bron",<SourceBadge st={place?"live":"miss"}/>,
        !place?<NoKey label="Google Places API" url="https://console.cloud.google.com"/>:(
          <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              {[["Naam",place.displayName?.text],["Adres",place.formattedAddress],["Telefoon",place.nationalPhoneNumber],["Status",place.businessStatus],["Prijsniveau",place.priceLevel]].map(([k,v])=><KVRow key={k} k={k} v={v} vs={k==="Status"?{color:place.businessStatus==="OPERATIONAL"?G.green:G.orange}:{}}/>)}
            </div>
            <div>
              {[["Website",place.websiteUri],["Rating",place.rating?`${place.rating} / 5`:null],["Recensies",place.userRatingCount?.toLocaleString("nl-NL")],["Typen",place.types?.slice(0,3).join(", ")]].map(([k,v])=><KVRow key={k} k={k} v={v} vs={k==="Rating"?{color:sc(place.rating||0)}:k==="Website"?{color:G.blue}:{}}/>)}
            </div>
          </div>
          {place.regularOpeningHours?.weekdayDescriptions?.length>0&&<div style={{marginTop:14,borderTop:`1px solid ${G.border}`,paddingTop:12}}><div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,marginBottom:8}}>Openingstijden</div>{place.regularOpeningHours.weekdayDescriptions.map((d,i)=><div key={i} style={{fontSize:11,color:G.textMid,padding:"3px 0",borderBottom:`1px solid ${G.border}`}}>{d}</div>)}</div>}
          {place.editorialSummary?.text&&<div style={{marginTop:12,fontSize:11.5,color:G.textMid,lineHeight:1.7,borderTop:`1px solid ${G.border}`,paddingTop:10}}>{place.editorialSummary.text}</div>}
          </>
        )
      )}

      {panel("KVK Handelsregister — Aanvullend",
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <SourceBadge st={kvkSt==="done"?"live":kvkSt==="loading"?"loading":kvkSt==="no_key"||kvkSt==="idle"?"miss":"cors"}/>
          {kvkSt!=="loading"&&kvkSt!=="done"&&keys.kvkKey&&<button onClick={fetchKVK} style={{background:G.blueDim,border:`1px solid ${G.blueBorder}`,color:G.blue,padding:"3px 10px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1}}>Ophalen</button>}
        </div>,
        <>
          {kvkSt==="idle"&&!keys.kvkKey&&<NoKey label="KVK API" url="https://developers.kvk.nl"/>}
          {kvkSt==="idle"&&keys.kvkKey&&<div style={{fontFamily:"IBM Plex Mono",fontSize:10.5,color:G.textDim,lineHeight:1.7}}>Klik <strong>Ophalen</strong> om KVK-data op te halen als aanvulling op Google Business.</div>}
          {kvkSt==="loading"&&<div style={{display:"flex",gap:8,alignItems:"center",color:G.textDim,fontFamily:"IBM Plex Mono",fontSize:10.5}}><Spin color={G.blue}/>KVK ophalen...</div>}
          {kvkSt==="cors"&&<NoCors url={kvkUrl}/>}
          {kvkSt==="empty"&&<Alert type="info">Geen KVK-resultaten voor "{bizName}".</Alert>}
          {kvkSt==="error"&&<Alert type="bad">KVK API fout. <button onClick={fetchKVK} style={{background:"none",border:"none",color:G.orange,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:10}}>Opnieuw</button></Alert>}
          {kvkSt==="done"&&kvkData&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>{[["Naam",kvkData.naam],["KVK-nummer",kvkData.kvkNummer],["Vestigingsnr.",kvkData.vestigingsnummer],["SBI-code",kvkData.sbiCode||kvkData.sbiHoofdactiviteit]].map(([k,v])=><KVRow key={k} k={k} v={v}/>)}</div>
              <div>{[["Rechtsvorm",kvkData.rechtsvorm],["Status",kvkData.indActief?"Actief":"Opgeheven"],["Opgericht",kvkData.datumOprichting],["Postcode",kvkData.adres?.binnenlandsAdres?.postcode]].map(([k,v])=><KVRow key={k} k={k} v={v} vs={k==="Status"?{color:kvkData.indActief?G.green:G.red}:{}}/>)}</div>
            </div>
            {kvkData.functionarissen?.length>0&&<div style={{marginTop:14,borderTop:`1px solid ${G.border}`,paddingTop:12}}><div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,marginBottom:8}}>Bestuurders (KVK)</div>{kvkData.functionarissen.map((f,i)=><div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${G.border}`,fontSize:11.5}}><span style={{width:5,height:5,borderRadius:"50%",background:G.accent,flexShrink:0,marginTop:6}}/><span>{f.naam}</span><span style={{color:G.textDim,fontSize:10}}>{f.functietitel}</span></div>)}</div>}
          </>}
          <div style={{marginTop:12,fontFamily:"IBM Plex Mono",fontSize:9,color:G.textDim,lineHeight:1.6,borderTop:`1px solid ${G.border}`,paddingTop:10}}>KVK geeft bedrijfsstructuur en bestuurders. Google Business geeft adres, openingstijden en rating — nuttig als KVK-data beperkt beschikbaar is.</div>
        </>
      )}
    </div>
  );
}

// ── REVIEWS TAB ───────────────────────────────────────────────────────────────
function ReviewsTab({keys,place}){
  const [reviews,setR]=useState(place?.reviews||null);
  const [st,setSt]=useState(place?.reviews?.length?"done":"idle");

  const fetch5=async()=>{
    if(!keys.googleKey){setSt("no_key");return;}
    if(!place?.id){setSt("no_place");return;}
    setSt("loading");
    try{
      const res=await fetch(`https://places.googleapis.com/v1/places/${place.id}`,{headers:{"X-Goog-Api-Key":keys.googleKey,"X-Goog-FieldMask":"reviews,rating,userRatingCount"}});
      const json=await res.json();
      if(json.error)throw new Error(json.error.message);
      setR(json.reviews||[]);setSt(json.reviews?.length?"done":"empty");
    }catch{setSt("error");}
  };

  return(
    <div>
      {place?.rating&&(
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px",marginBottom:14}}>
          <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,marginBottom:12}}>Google Rating</div>
          <PBarRow name="Google Maps" score={place.rating} count={`${place.userRatingCount?.toLocaleString("nl-NL")} reviews`}/>
          <div style={{marginTop:10,fontSize:11,color:G.textDim,fontFamily:"IBM Plex Mono",lineHeight:1.7}}>Google Places API geeft max 5 reviews. TripAdvisor en TheFork vereisen eigen API sleutels.</div>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim}}>Google Reviews</div>
        {st!=="done"&&keys.googleKey&&<button onClick={fetch5} disabled={st==="loading"} style={{background:G.blueDim,border:`1px solid ${G.blueBorder}`,color:G.blue,padding:"4px 12px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1}}>{st==="loading"?"Ophalen...":"Ophalen"}</button>}
      </div>
      {st==="loading"&&<div style={{display:"flex",gap:8,alignItems:"center",color:G.textDim,fontFamily:"IBM Plex Mono",fontSize:10.5,padding:"12px 0"}}><Spin color={G.blue}/>Reviews ophalen...</div>}
      {st==="no_key"&&<NoKey label="Google Places API" url="https://console.cloud.google.com"/>}
      {st==="no_place"&&<Alert type="info">Voer eerst een zoekopdracht uit zodat het Google Place ID beschikbaar is.</Alert>}
      {st==="empty"&&<Alert type="info">Geen reviews gevonden voor dit bedrijf.</Alert>}
      {st==="error"&&<Alert type="bad">Fout bij ophalen reviews. Controleer Google API sleutel.</Alert>}
      {(st==="idle"&&!place)||(!keys.googleKey&&!place)?<NoKey label="Google Places API" url="https://console.cloud.google.com"/>:null}
      {st==="done"&&reviews&&reviews.map((r,i)=>{
        const txt=r.text?.text||r.originalText?.text||"";
        return(
          <Exp key={i} title={txt.slice(0,80)+(txt.length>80?"…":")||"Geen tekst"} meta={r.relativePublishTimeDescription} badge={`${r.rating}/5`} bs={r.rating>=4?"ok":r.rating>=3?"warn":"bad"} open={i===0}>
            <KVRow k="Auteur" v={r.authorAttribution?.displayName}/>
            <KVRow k="Score" v={`${r.rating} / 5`} vs={{color:sc(r.rating)}}/>
            <KVRow k="Datum" v={r.relativePublishTimeDescription}/>
            {txt&&<div style={{marginTop:10,fontSize:11.5,color:G.text,lineHeight:1.7}}>{txt}</div>}
          </Exp>
        );
      })}
    </div>
  );
}

// ── VERGUNNINGEN TAB ──────────────────────────────────────────────────────────
function detectGem(name,addr=""){
  const h=(name+" "+addr).toLowerCase();
  if(h.includes("amsterdam"))return"amsterdam";
  if(h.includes("den haag")||h.includes("s-gravenhage"))return"den-haag";
  if(h.includes("leiden"))return"leiden";
  if(h.includes("zoetermeer"))return"zoetermeer";
  if(h.includes("utrecht"))return"utrecht";
  if(h.includes("rotterdam"))return"rotterdam";
  if(h.includes("groningen"))return"groningen";
  if(h.includes("eindhoven"))return"eindhoven";
  return null;
}

function PermitsTab({keys,bizName,bizAddress}){
  const [st,setSt]=useState("idle");
  const [results,setRes]=useState([]);
  const [srcUrl,setSrc]=useState(null);
  const gem=detectGem(bizName,bizAddress);
  const isAms=gem==="amsterdam";

  const buildUrl=()=>{
    if(isAms){const p=new URLSearchParams({_format:"json",_pageSize:"10"});p.set("naam",bizName.split(" ").slice(0,3).join(" "));if(bizAddress)p.set("adres",bizAddress.split(",")[0]);return`https://api.data.amsterdam.nl/v1/horeca/exploitatievergunning/?${p}`;}
    const q=[`c.product-area=gemeenteblad`,`cql.textAndIndexes="${bizName.split(" ")[0]}"`,gem?`dt.creator="${gem.charAt(0).toUpperCase()+gem.slice(1).replace("-"," ")}"`:""  ].filter(Boolean).join(" AND ");
    return`https://repository.overheid.nl/sru?operation=searchRetrieve&version=2.0&maximumRecords=10&query=${encodeURIComponent(q)}`;
  };

  const go=async()=>{
    setSt("loading");setRes([]);
    const url=buildUrl();setSrc(url);
    const fUrl=keys.proxyUrl?`${keys.proxyUrl.replace(/\/$/,"")}?url=${encodeURIComponent(url)}`:url;
    try{
      const res=await fetch(fUrl,{headers:{Accept:isAms?"application/json":"application/xml"}});
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      if(isAms){
        const json=await res.json();
        const items=json._embedded?.exploitatievergunning||json.results||[];
        const out=items.map(item=>({name:item.naam||item.handelsnaam||"Vergunning",nr:item.zaakId||item.id||"-",status:item.datumTotEnMet?(new Date(item.datumTotEnMet)<new Date()?"Verlopen":"Actief"):"Actief",expires:item.datumTotEnMet||"Onbepaald",gemeente:"Amsterdam",adres:item.adres?.volledigAdres||"-",categorie:item.categorie||"-"}));
        setRes(out);setSt(out.length?"done":"empty");
      }else{
        const text=await res.text();
        const doc=new DOMParser().parseFromString(text,"text/xml");
        const out=[];
        doc.querySelectorAll("record").forEach(rec=>{const title=rec.querySelector("title")?.textContent||"";const date=rec.querySelector("modified,date")?.textContent||"";const id=rec.querySelector("identifier")?.textContent||"";const creator=rec.querySelector("creator")?.textContent||"";if(title.toLowerCase().match(/vergunning|ontheffing|horeca/))out.push({name:title,date,identifier:id,creator,nr:id.split("/").pop()||"-",status:"Gepubliceerd"});});
        setRes(out);setSt(out.length?"done":"empty");
      }
    }catch(e){setSt(e.message.includes("fetch")||e.message.includes("Failed")?"cors":"error");}
  };

  return(
    <div>
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim}}>Live Vergunningen API</div>
          <span style={{fontFamily:"IBM Plex Mono",fontSize:8.5,padding:"2px 7px",borderRadius:3,background:G.purpleDim,border:`1px solid ${G.purpleBorder}`,color:G.purple}}>{isAms?"Amsterdam REST":"Overheid.nl SRU"}</span>
          {gem&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,border:`1px solid ${G.border}`,color:G.textMid,marginLeft:"auto"}}>{gem}</span>}
          {!gem&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,background:G.orangeDim,border:`1px solid ${G.orangeBorder}`,color:G.orange,marginLeft:"auto"}}>gemeente onbekend</span>}
        </div>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:9.5,color:G.textDim,marginBottom:12,lineHeight:1.7}}>{isAms?"api.data.amsterdam.nl/v1/horeca/exploitatievergunning/ — live register, geen API sleutel":`repository.overheid.nl/sru — gemeenteblad${gem?` voor ${gem}`:" — voeg stad toe aan zoekopdracht"}`}</div>
        {!gem&&<Alert type="info">Geen gemeente herkend — voeg stadsnaam toe, bijv. "Restaurant De Kas Amsterdam".</Alert>}
        {!isAms&&!keys.proxyUrl&&<Alert type="warn">SRU endpoint vereist proxy vanuit browser. Voeg proxy URL toe in Instellingen.</Alert>}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:4}}>
          <button onClick={go} disabled={st==="loading"} style={{background:st==="loading"?G.border:G.purpleDim,border:`1px solid ${G.purpleBorder}`,color:st==="loading"?G.textDim:G.purple,padding:"6px 16px",borderRadius:3,cursor:st==="loading"?"not-allowed":"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>{st==="loading"?"Ophalen...":"Haal Vergunningen Op"}</button>
          {srcUrl&&<a href={srcUrl} target="_blank" rel="noreferrer" style={{fontFamily:"IBM Plex Mono",fontSize:9,color:G.blue,textDecoration:"none",padding:"6px 10px",border:`1px solid ${G.blueBorder}`,borderRadius:3,background:G.blueDim}}>Bekijk Raw URL</a>}
        </div>
        {st==="loading"&&<div style={{display:"flex",gap:8,alignItems:"center",marginTop:12,fontFamily:"IBM Plex Mono",fontSize:10.5,color:G.purple}}><Spin/>API aanroep bezig...</div>}
        {st==="cors"&&<div style={{marginTop:12}}><NoCors url={srcUrl}/></div>}
        {st==="empty"&&<div style={{marginTop:12}}><Alert type="info">Geen vergunningen gevonden. Probeer kortere naam of controleer gemeente.</Alert></div>}
        {st==="error"&&<div style={{marginTop:12}}><Alert type="bad">API fout bij ophalen vergunningen.</Alert></div>}
        {st==="done"&&results.length>0&&<div style={{marginTop:14}}>
          <div style={{marginBottom:10}}><Alert type="ok">{results.length} vergunning{results.length>1?"en":""} gevonden via live API</Alert></div>
          {results.map((r,i)=>(
            <Exp key={i} title={r.name.length>72?r.name.slice(0,72)+"…":r.name} meta={r.date||r.expires||""} badge="+ Live" bs="ok" open={i===0}>
              {r.nr!=="-"&&<KVRow k="Nummer" v={r.nr}/>}
              <KVRow k="Status" v={r.status} vs={{color:r.status==="Actief"?G.green:r.status==="Verlopen"?G.red:G.text}}/>
              <KVRow k="Vervaldatum" v={r.expires}/>
              <KVRow k="Gemeente" v={r.gemeente||r.creator}/>
              {r.adres!=="-"&&<KVRow k="Adres" v={r.adres}/>}
              {r.categorie!=="-"&&<KVRow k="Categorie" v={r.categorie}/>}
              {r.identifier&&<div style={{marginTop:8}}><a href={`https://zoek.officielebekendmakingen.nl/${r.identifier}`} target="_blank" rel="noreferrer" style={{fontFamily:"IBM Plex Mono",fontSize:9.5,color:G.blue}}>Bekijk originele bekendmaking</a></div>}
            </Exp>
          ))}
        </div>}
      </div>
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px"}}>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,marginBottom:12}}>API Dekking per Gemeente</div>
        {[{gem:"Amsterdam",api:"api.data.amsterdam.nl/v1/horeca/",type:"REST/JSON",proxy:"Nee",note:"Live register, direct querybaarbaar"},{gem:"Den Haag",api:"repository.overheid.nl/sru",type:"SRU/XML",proxy:"Ja",note:"Gemeenteblad bekendmakingen"},{gem:"Leiden",api:"repository.overheid.nl/sru",type:"SRU/XML",proxy:"Ja",note:"Gemeenteblad bekendmakingen"},{gem:"Zoetermeer",api:"repository.overheid.nl/sru",type:"SRU/XML",proxy:"Ja",note:"Gemeenteblad bekendmakingen"},{gem:"Utrecht",api:"repository.overheid.nl/sru",type:"SRU/XML",proxy:"Ja",note:"Gemeenteblad bekendmakingen"},{gem:"Rotterdam + overig NL",api:"repository.overheid.nl/sru",type:"SRU/XML",proxy:"Ja",note:"Alle NL gemeenten gedekt"}].map(r=>(
          <div key={r.gem} style={{padding:"9px 0",borderBottom:`1px solid ${G.border}`}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
              <span style={{fontSize:12,fontWeight:500,minWidth:110}}>{r.gem}</span>
              <span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 7px",borderRadius:3,background:G.blueDim,border:`1px solid ${G.blueBorder}`,color:G.blue}}>{r.type}</span>
              <span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 7px",borderRadius:3,background:r.proxy==="Nee"?G.greenDim:G.orangeDim,border:`1px solid ${r.proxy==="Nee"?G.greenBorder:G.orangeBorder}`,color:r.proxy==="Nee"?G.green:G.orange}}>Proxy: {r.proxy}</span>
            </div>
            <div style={{fontFamily:"IBM Plex Mono",fontSize:9.5,color:G.textDim}}>{r.api}</div>
            <div style={{fontSize:10.5,color:G.textMid,marginTop:2}}>{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EMAILS TAB ────────────────────────────────────────────────────────────────
function EmailsTab({keys,place}){
  const [st,setSt]=useState("idle");
  const [results,setRes]=useState([]);
  const [copied,setCopied]=useState(null);

  const domain=place?.websiteUri?place.websiteUri.replace(/^https?:\/\//,"").replace(/\/.*$/,"").replace(/^www\./,""):null;

  const go=async()=>{
    if(!keys.hunterKey){setSt("no_key");return;}
    if(!domain){setSt("no_domain");return;}
    setSt("loading");
    try{
      const res=await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${keys.hunterKey}&limit=10`);
      const json=await res.json();
      if(json.errors)throw new Error(json.errors[0]?.details||"Hunter error");
      setRes(json.data?.emails||[]);setSt(json.data?.emails?.length?"done":"empty");
    }catch{setSt("error");}
  };

  const copy=e=>{navigator.clipboard.writeText(e).then(()=>{setCopied(e);setTimeout(()=>setCopied(null),2000);});};

  return(
    <div>
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim}}>Hunter.io Email Extractie</div>
          <span style={{fontFamily:"IBM Plex Mono",fontSize:8.5,padding:"2px 7px",borderRadius:3,background:G.purpleDim,border:`1px solid ${G.purpleBorder}`,color:G.purple}}>Domain Search</span>
          {domain&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,border:`1px solid ${G.border}`,color:G.textMid,marginLeft:"auto"}}>{domain}</span>}
        </div>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:9.5,color:G.textDim,marginBottom:12,lineHeight:1.7}}>{domain?`Domein automatisch herkend via Google Business: ${domain}`:"Domein via Google Business website. Voeg Google Places sleutel toe voor automatische domeindetectie."}</div>
        {!keys.hunterKey&&<div style={{marginBottom:10}}><Alert type="warn">Hunter.io sleutel ontbreekt. Gratis tier: 25 zoekopdrachten/maand — <a href="https://hunter.io" target="_blank" rel="noreferrer" style={{color:G.orange}}>hunter.io</a></Alert></div>}
        {!domain&&keys.hunterKey&&<div style={{marginBottom:10}}><Alert type="info">Geen domein gevonden. Voeg Google Places sleutel toe voor automatische domeindetectie.</Alert></div>}
        <button onClick={go} disabled={st==="loading"||!keys.hunterKey||!domain} style={{background:st==="loading"||!keys.hunterKey||!domain?G.border:G.purpleDim,border:`1px solid ${G.purpleBorder}`,color:st==="loading"||!keys.hunterKey||!domain?G.textDim:G.purple,padding:"6px 16px",borderRadius:3,cursor:st==="loading"||!keys.hunterKey||!domain?"not-allowed":"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}>{st==="loading"?"Zoeken...":"Zoek Emails"}</button>
      </div>
      {st==="loading"&&<div style={{display:"flex",gap:8,alignItems:"center",color:G.textDim,fontFamily:"IBM Plex Mono",fontSize:10.5,padding:"12px 0"}}><Spin color={G.blue}/>Hunter.io doorzoeken...</div>}
      {st==="empty"&&<Alert type="info">Geen publieke emails gevonden voor {domain}.</Alert>}
      {st==="error"&&<Alert type="bad">Hunter.io API fout. Controleer sleutel en quota.</Alert>}
      {st==="done"&&results.length>0&&(
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"16px 18px"}}>
          <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,marginBottom:12}}>Gevonden Emails — {domain} — {results.length} resultaten</div>
          {results.map((e,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${G.border}`,gap:10}}>
              <div>
                <div style={{fontFamily:"IBM Plex Mono",fontSize:11.5,color:G.blue}}>{e.value}</div>
                <div style={{fontFamily:"IBM Plex Mono",fontSize:9.5,color:G.textDim,marginTop:2}}>{e.first_name&&`${e.first_name} ${e.last_name||""} · `}{e.position||e.type||""}{ " · "}{e.confidence}% betrouwbaar</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {e.type&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 7px",borderRadius:3,background:G.blueDim,border:`1px solid ${G.blueBorder}`,color:G.blue}}>{e.type}</span>}
                <button onClick={()=>copy(e.value)} style={{background:"none",border:`1px solid ${copied===e.value?G.green:G.border}`,color:copied===e.value?G.green:G.textDim,padding:"3px 9px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1,transition:"all 0.15s"}}>{copied===e.value?"Gekopieerd":"Kopieer"}</button>
              </div>
            </div>
          ))}
          <div style={{marginTop:12}}><Alert type="info">Gebruik conform AVG / GDPR regelgeving.</Alert></div>
        </div>
      )}
    </div>
  );
}

// ── LOADING ───────────────────────────────────────────────────────────────────
function LoadingView({label,onDone}){
  const [step,setStep]=useState(0);
  useEffect(()=>{
    const t=setInterval(()=>setStep(s=>{if(s>=LOAD_STEPS.length-1){clearInterval(t);setTimeout(onDone,300);return s;}return s+1;}),360);
    return()=>clearInterval(t);
  },[onDone]);
  return(
    <div style={{padding:"32px 0",maxWidth:440}}>
      <div style={{fontFamily:"Bebas Neue",fontSize:30,letterSpacing:2,marginBottom:4}}>Analyseren</div>
      <div style={{fontFamily:"IBM Plex Mono",fontSize:10,color:G.textDim,marginBottom:22,letterSpacing:1}}>{label.toUpperCase()}</div>
      {LOAD_STEPS.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",fontFamily:"IBM Plex Mono",fontSize:10.5,color:i<step?G.green:i===step?G.text:G.textDim,transition:"color 0.25s"}}>
          <span style={{width:14,textAlign:"center",flexShrink:0}}>{i<step?"+":i===step?">":"·"}</span><span>{s}</span>
        </div>
      ))}
      <div style={{width:"100%",height:2,background:G.border,borderRadius:1,marginTop:18,overflow:"hidden"}}><div style={{height:"100%",background:G.accent,borderRadius:1,width:`${((step+1)/LOAD_STEPS.length)*100}%`,transition:"width 0.35s ease"}}/></div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
const SFIELDS=[
  {sec:"AI Intel",fields:[{k:"anthropicKey",label:"Anthropic API Key",ph:"sk-ant-...",type:"password",desc:"Vereist voor AI OSINT analyse. Via console.anthropic.com."}]},
  {sec:"Google Business & Reviews — Primaire Bron",fields:[{k:"googleKey",label:"Google Places API Key",ph:"AIza...",type:"password",desc:"Naam, adres, openingstijden, rating, reviews, website, telefoon. Via console.cloud.google.com — gratis t/m $200/maand."}]},
  {sec:"KVK Handelsregister — Aanvullend",fields:[{k:"kvkKey",label:"KVK API Key",ph:"KVK developer sleutel",type:"password",desc:"Bedrijfsstructuur, SBI-code, bestuurders, rechtsvorm. Via developers.kvk.nl — gratis developer account."}]},
  {sec:"Email Extractie",fields:[{k:"hunterKey",label:"Hunter.io API Key",ph:"Hunter API sleutel",type:"password",desc:"Publieke emails uit bedrijfsdomein. Domein automatisch via Google Business. Gratis: 25/maand via hunter.io."}]},
  {sec:"Proxy URL — CORS Oplossing",fields:[{k:"proxyUrl",label:"Proxy URL",ph:"https://uw-proxy.vercel.app/api/proxy",type:"text",desc:"Vereist voor KVK API en Overheid.nl SRU vanuit browser. Zie Vergunningen tab voor kant-en-klare Vercel proxy code."}]},
];

function SettingsDrawer({keys,onChange,onClose}){
  const [local,setL]=useState({...keys});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",justifyContent:"flex-end"}} onClick={onClose}>
      <div style={{width:440,height:"100%",background:G.surface,borderLeft:`1px solid ${G.border}`,display:"flex",flexDirection:"column",animation:"slideIn 0.22s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:20,letterSpacing:2}}>API Instellingen</div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${G.border}`,color:G.textMid,width:26,height:26,borderRadius:3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1}}>
          {SFIELDS.map(({sec,fields})=>(
            <div key={sec}>
              <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,margin:"20px 0 12px",paddingBottom:7,borderBottom:`1px solid ${G.border}`}}>{sec}</div>
              {fields.map(({k,label,ph,type,desc})=>(
                <div key={k} style={{marginBottom:14}}>
                  <div style={{fontFamily:"IBM Plex Mono",fontSize:9.5,color:G.textMid,marginBottom:4}}>{label}</div>
                  <div style={{fontSize:10.5,color:G.textDim,marginBottom:6,lineHeight:1.55}}>{desc}</div>
                  <input type={type} placeholder={ph} value={local[k]||""} onChange={e=>setL(l=>({...l,[k]:e.target.value}))} style={{width:"100%",background:G.bg,border:`1px solid ${G.border}`,borderRadius:3,padding:"7px 11px",fontFamily:"IBM Plex Mono",fontSize:10.5,color:G.text,outline:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4,fontFamily:"IBM Plex Mono",fontSize:9.5}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:local[k]?G.green:G.border,display:"inline-block"}}/>
                    <span style={{color:local[k]?G.green:G.textDim}}>{local[k]?"Geconfigureerd":"Niet ingevuld"}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <button onClick={()=>{onChange(local);onClose();}} style={{width:"100%",background:G.accent,color:"#000",border:"none",padding:10,borderRadius:3,fontFamily:"IBM Plex Mono",fontSize:10,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600,cursor:"pointer",marginTop:16}}>Opslaan & Sluiten</button>
        </div>
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Bebas+Neue&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:${G.bg};color:${G.text};font-family:'IBM Plex Sans',sans-serif;font-size:13px;line-height:1.55;-webkit-font-smoothing:antialiased}
input,button,select{font-family:inherit}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fi 0.3s ease both}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${G.border};border-radius:2px}
`;

// ── MAIN APP ──────────────────────────────────────────────────────────────────
const TABS=[{id:"overview",label:"Overzicht"},{id:"bedrijf",label:"Bedrijf"},{id:"reviews",label:"Reviews"},{id:"permits",label:"Vergunningen"},{id:"emails",label:"Emails"}];

export default function App(){
  const [query,setQ]=useState("");
  const [view,setV]=useState("welcome");
  const [tab,setTab]=useState("overview");
  const [keys,setKeys]=useState({});
  const [showS,setSS]=useState(false);
  const [selBiz,setSel]=useState(null);
  const [place,setPlace]=useState(null);
  const [kvk,setKVK]=useState(null);
  const [sugs,setSugs]=useState([]);
  const [showAC,setAC]=useState(false);
  const [acI,setACI]=useState(-1);
  const inputRef=useRef(null);
  const acRef=useRef(null);

  useEffect(()=>{
    if(query.length<2){setSugs([]);setAC(false);return;}
    const q=query.toLowerCase();
    const f=HINTS.filter(h=>h.name.toLowerCase().includes(q)||h.type.toLowerCase().includes(q)).slice(0,6);
    setSugs(f);setAC(f.length>0);setACI(-1);
  },[query]);

  useEffect(()=>{
    const h=e=>{if(!acRef.current?.contains(e.target))setAC(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const run=useCallback((biz)=>{
    const b=biz||selBiz||{name:query};
    if(!b.name?.trim())return;
    setSel(b);setAC(false);setV("loading");setPlace(null);setKVK(null);
  },[query,selBiz]);

  const selHint=h=>{setQ(h.name);setSel(h);setAC(false);setTimeout(()=>run(h),40);};

  const hKey=e=>{
    if(!showAC){if(e.key==="Enter")run();return;}
    if(e.key==="ArrowDown"){e.preventDefault();setACI(i=>Math.min(i+1,sugs.length-1));}
    else if(e.key==="ArrowUp"){e.preventDefault();setACI(i=>Math.max(i-1,-1));}
    else if(e.key==="Enter"){e.preventDefault();if(acI>=0)selHint(sugs[acI]);else run();}
    else if(e.key==="Escape")setAC(false);
  };

  const handleLoaded=useCallback(async()=>{
    setV("result");setTab("overview");
    const biz=selBiz||{name:query};
    if(keys.googleKey){
      try{
        const r=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":keys.googleKey,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.regularOpeningHours,places.types,places.priceLevel,places.editorialSummary,places.reviews"},body:JSON.stringify({textQuery:`${biz.name} Netherlands`,languageCode:"nl",maxResultCount:1})});
        const j=await r.json();if(j.places?.[0])setPlace(j.places[0]);
      }catch(e){console.error("Google Places:",e);}
    }
    if(keys.kvkKey){
      try{
        const zu=`https://api.kvk.nl/api/v2/zoeken?naam=${encodeURIComponent(biz.name)}&pagina=1&resultatenperpagina=1`;
        const zr=await fetch(keys.proxyUrl?`${keys.proxyUrl.replace(/\/$/,"")}?url=${encodeURIComponent(zu)}`:zu,{headers:{apikey:keys.kvkKey}});
        const zj=await zr.json();const first=zj.resultaten?.[0];
        if(first){const bu=`https://api.kvk.nl/api/v1/basisprofielen/${first.kvkNummer}`;const bp=await fetch(keys.proxyUrl?`${keys.proxyUrl.replace(/\/$/,"")}?url=${encodeURIComponent(bu)}`:bu,{headers:{apikey:keys.kvkKey}});setKVK({...first,...await bp.json()});}
      }catch(e){console.error("KVK:",e);}
    }
  },[keys,query,selBiz]);

  const reset=()=>{setV("welcome");setSel(null);setQ("");setPlace(null);setKVK(null);};
  const bizName=selBiz?.name||query;
  const bizAddr=place?.formattedAddress||"";

  const SB=(style={})=>(
    <aside style={{width:224,flexShrink:0,borderRight:`1px solid ${G.border}`,background:G.surface,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:50,overflowY:"auto",...style}}>
      <div style={{padding:"18px 18px 14px",borderBottom:`1px solid ${G.border}`}}>
        <div style={{fontFamily:"Bebas Neue",fontSize:25,letterSpacing:2,color:G.accent,lineHeight:1}}>HorecaIntel</div>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:8,letterSpacing:3,textTransform:"uppercase",color:G.textDim,marginTop:3}}>NL Hospitality Intelligence</div>
      </div>
      {view==="result"&&(
        <div style={{padding:"10px 0 4px",borderBottom:`1px solid ${G.border}`}}>
          <div style={{fontFamily:"IBM Plex Mono",fontSize:8,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,padding:"0 18px 6px"}}>Intel Modules</div>
          {TABS.map(t=>(
            <div key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 18px",cursor:"pointer",fontSize:12,color:tab===t.id?G.accent:G.textMid,background:tab===t.id?"rgba(201,245,66,0.07)":"transparent",borderRight:tab===t.id?`2px solid ${G.accent}`:"2px solid transparent",transition:"all 0.1s"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:tab===t.id?G.accent:G.border,flexShrink:0}}/>{t.label}
            </div>
          ))}
        </div>
      )}
      <div style={{padding:"10px 0 4px",borderBottom:"none"}}>
        <div style={{fontFamily:"IBM Plex Mono",fontSize:8,letterSpacing:2.5,textTransform:"uppercase",color:G.textDim,padding:"0 18px 6px"}}>Snelzoekopdrachten</div>
        {HINTS.slice(0,6).map(h=>(
          <div key={h.name} onClick={()=>{setQ(h.name);run(h);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 18px",cursor:"pointer",fontSize:11,color:G.textMid,transition:"all 0.1s"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:G.border,flexShrink:0}}/>
            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop:"auto",padding:"14px 18px",borderTop:`1px solid ${G.border}`,display:"flex",flexDirection:"column",gap:7}}>
        <button onClick={()=>setSS(true)} style={{width:"100%",background:"rgba(201,245,66,0.05)",border:"1px solid rgba(201,245,66,0.3)",color:G.accent,padding:"7px 10px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",textAlign:"left",transition:"all 0.15s"}}>API Instellingen</button>
        <button onClick={reset} style={{width:"100%",background:"none",border:`1px solid ${G.border}`,color:G.textMid,padding:"7px 10px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",textAlign:"left",transition:"all 0.15s"}}>Nieuwe Zoekopdracht</button>
      </div>
    </aside>
  );

  return(
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",minHeight:"100vh"}}>
        <SB/>
        <main style={{marginLeft:224,flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>

          {/* TOPBAR */}
          <div style={{height:52,borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",padding:"0 24px",gap:10,background:G.surface,position:"sticky",top:0,zIndex:40}}>
            <div style={{position:"relative",flex:1,maxWidth:580}} ref={acRef}>
              <div style={{display:"flex",alignItems:"center",background:G.bg,border:`1px solid ${G.border}`,borderRadius:4,overflow:"hidden",transition:"border-color 0.15s"}}>
                <span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:G.accent,padding:"0 11px",borderRight:`1px solid ${G.border}`,height:34,display:"flex",alignItems:"center",flexShrink:0}}>NL &gt;</span>
                <input ref={inputRef} placeholder="Zoek op naam, stad of type..." value={query} onChange={e=>{setQ(e.target.value);setSel(null);}} onKeyDown={hKey} onFocus={()=>sugs.length>0&&setAC(true)} autoComplete="off" style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"0 12px",fontFamily:"IBM Plex Mono",fontSize:12,color:G.text,height:34}}/>
                <button onClick={()=>run()} disabled={!query.trim()} style={{background:query.trim()?G.accent:G.border,color:query.trim()?"#000":G.textDim,border:"none",height:34,padding:"0 16px",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",cursor:query.trim()?"pointer":"not-allowed",fontWeight:600}}>Analyseer</button>
              </div>
              {showAC&&sugs.length>0&&(
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:G.surface,border:`1px solid ${G.borderHigh}`,borderRadius:4,overflow:"hidden",zIndex:100,boxShadow:"0 12px 40px rgba(0,0,0,0.7)"}}>
                  {sugs.map((h,i)=>(
                    <div key={h.name} onMouseDown={()=>selHint(h)} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 14px",cursor:"pointer",background:i===acI?G.surfaceHigh:"transparent",borderBottom:`1px solid ${G.border}`,transition:"background 0.1s"}}>
                      <div style={{flex:1}}><div style={{fontSize:13,color:G.text,fontWeight:500}}>{h.name}</div><div style={{fontFamily:"IBM Plex Mono",fontSize:10,color:G.textDim,marginTop:1}}>{h.type}</div></div>
                      <span style={{fontFamily:"IBM Plex Mono",fontSize:9,padding:"2px 6px",borderRadius:2,background:G.blueDim,border:`1px solid ${G.blueBorder}`,color:G.blue,flexShrink:0}}>{h.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {view==="result"&&<button onClick={reset} style={{background:"none",border:`1px solid ${G.border}`,color:G.textDim,padding:"5px 12px",borderRadius:3,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:1}}>Wis</button>}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontFamily:"IBM Plex Mono",fontSize:9.5,color:G.green,letterSpacing:1}}>
              <div style={{width:6,height:6,background:G.green,borderRadius:"50%",animation:"pulse 2.5s ease-in-out infinite"}}/> Live
            </div>
          </div>

          {/* CONTENT */}
          <div style={{flex:1,padding:"22px 24px"}}>

            {view==="welcome"&&(
              <div style={{padding:"36px 0",maxWidth:680}} className="fade">
                <div style={{fontFamily:"Bebas Neue",fontSize:50,letterSpacing:3,lineHeight:1,marginBottom:8}}>Volledige Intel op<br/><span style={{color:G.accent}}>Elk Horeca Bedrijf</span></div>
                <div style={{fontFamily:"IBM Plex Mono",fontSize:10.5,color:G.textDim,marginBottom:28,lineHeight:1.8}}>Google Business · KVK · Reviews · Vergunningen · Emails · AI OSINT<br/>Alle data is live. Geen verzonnen data. Altijd eerlijk over wat beschikbaar is.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:28}}>
                  {[
                    {t:"Google Business — Primair",d:"Adres, openingstijden, rating, reviews, website en telefoon. Werkt ook als KVK-data beperkt is."},
                    {t:"KVK — Aanvullend",d:"Bedrijfsstructuur, SBI-code, bestuurders en rechtsvorm als verdieping bovenop Google-data."},
                    {t:"Live Vergunningen",d:"Amsterdam REST API direct. Alle andere NL gemeenten via Overheid.nl SRU, geen API sleutel nodig."},
                    {t:"Google Reviews",d:"Max 5 meest recente reviews via Google Places API, met auteur, datum en volledige tekst."},
                    {t:"Email Extractie",d:"Hunter.io scant het bedrijfsdomein. Domein automatisch via Google Business website."},
                    {t:"AI OSINT Intel",d:"Claude Sonnet genereert rapport over reputatie, risicos en kansen op basis van live data."},
                  ].map(({t,d})=>(
                    <div key={t} style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:4,padding:"13px 15px"}}>
                      <div style={{fontFamily:"IBM Plex Mono",fontSize:10,fontWeight:600,color:G.text,marginBottom:5}}>{t}</div>
                      <div style={{fontSize:10.5,color:G.textDim,lineHeight:1.55}}>{d}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:"IBM Plex Mono",fontSize:8.5,letterSpacing:2,textTransform:"uppercase",color:G.textDim,marginBottom:9}}>Snel zoeken</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {HINTS.slice(0,5).map(h=><button key={h.name} onClick={()=>{setQ(h.name);run(h);}} style={{fontFamily:"IBM Plex Mono",fontSize:10.5,padding:"5px 12px",border:`1px solid ${G.border}`,borderRadius:3,color:G.textMid,cursor:"pointer",transition:"all 0.15s",background:"none"}}>{h.name}</button>)}
                </div>
              </div>
            )}

            {view==="loading"&&<LoadingView label={selBiz?.name||query} onDone={handleLoaded}/>}

            {view==="result"&&(
              <div className="fade">
                <div style={{marginBottom:20,paddingBottom:18,borderBottom:`1px solid ${G.border}`}}>
                  <div style={{fontFamily:"Bebas Neue",fontSize:38,letterSpacing:2,lineHeight:1}}>{place?.displayName?.text||bizName}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:9,flexWrap:"wrap"}}>
                    {place?.businessStatus&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,background:place.businessStatus==="OPERATIONAL"?G.greenDim:G.orangeDim,border:`1px solid ${place.businessStatus==="OPERATIONAL"?G.greenBorder:G.orangeBorder}`,color:place.businessStatus==="OPERATIONAL"?G.green:G.orange}}>{place.businessStatus}</span>}
                    {kvk?.kvkNummer&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,background:G.blueDim,border:`1px solid ${G.blueBorder}`,color:G.blue}}>KVK {kvk.kvkNummer}</span>}
                    {place?.formattedAddress&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,border:`1px solid ${G.border}`,color:G.textMid}}>{place.formattedAddress.split(",").slice(-2).join(",").trim()}</span>}
                    {place?.rating&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,background:sc(place.rating)+"20",border:`1px solid ${sc(place.rating)}66`,color:sc(place.rating)}}>{place.rating} / 5 ({place.userRatingCount?.toLocaleString("nl-NL")})</span>}
                    {!keys.googleKey&&<span style={{fontFamily:"IBM Plex Mono",fontSize:9.5,padding:"2px 8px",borderRadius:3,background:G.orangeDim,border:`1px solid ${G.orangeBorder}`,color:G.orange}}>Google API ontbreekt — voeg toe in Instellingen</span>}
                  </div>
                </div>
                <div style={{display:"flex",borderBottom:`1px solid ${G.border}`,marginBottom:20,overflowX:"auto"}}>
                  {TABS.map(t=>(
                    <div key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",fontSize:11,fontFamily:"IBM Plex Mono",letterSpacing:1,textTransform:"uppercase",cursor:"pointer",color:tab===t.id?G.accent:G.textDim,borderBottom:`2px solid ${tab===t.id?G.accent:"transparent"}`,marginBottom:-1,transition:"all 0.12s",whiteSpace:"nowrap"}}>{t.label}</div>
                  ))}
                </div>
                {tab==="overview"&&<OverviewTab keys={keys} bizName={bizName} place={place} kvk={kvk}/>}
                {tab==="bedrijf" &&<BedrijfTab  keys={keys} bizName={bizName} place={place} kvk={kvk} onKVKFetched={setKVK}/>}
                {tab==="reviews" &&<ReviewsTab  keys={keys} place={place}/>}
                {tab==="permits" &&<PermitsTab  keys={keys} bizName={bizName} bizAddress={bizAddr}/>}
                {tab==="emails"  &&<EmailsTab   keys={keys} place={place}/>}
              </div>
            )}
          </div>
        </main>
      </div>
      {showS&&<SettingsDrawer keys={keys} onChange={setKeys} onClose={()=>setSS(false)}/>}
    </>
  );
}
