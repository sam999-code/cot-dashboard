import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ============================================================================
   COT POSITIONING DASHBOARD
   Real CFTC "smart money" positioning — snapshot embedded from the data hub.
     GC  -> Gold (COMEX)      -> Managed Money
     NQ  -> Nasdaq-100 (CME)  -> Leveraged Funds
   Live version (auto-refreshed from Supabase) is the next step.
   ========================================================================== */

const COT_DATA = [{"date":"2025-01-07","sym":"GC","long":191873,"short":14232,"net":177641,"pctLong":93.1,"oi":477043},{"date":"2025-01-14","sym":"GC","long":206968,"short":11346,"net":195622,"pctLong":94.8,"oi":526467},{"date":"2025-01-21","sym":"GC","long":226964,"short":11095,"net":215869,"pctLong":95.3,"oi":571387},{"date":"2025-01-28","sym":"GC","long":227871,"short":17331,"net":210540,"pctLong":92.9,"oi":577505},{"date":"2025-02-04","sym":"GC","long":240485,"short":30952,"net":209533,"pctLong":88.6,"oi":542004},{"date":"2025-02-11","sym":"GC","long":229071,"short":34268,"net":194803,"pctLong":87.0,"oi":528719},{"date":"2025-02-18","sym":"GC","long":222538,"short":37209,"net":185329,"pctLong":85.7,"oi":522330},{"date":"2025-02-25","sym":"GC","long":212694,"short":32882,"net":179812,"pctLong":86.6,"oi":512179},{"date":"2025-03-04","sym":"GC","long":204965,"short":38307,"net":166658,"pctLong":84.3,"oi":489270},{"date":"2025-03-11","sym":"GC","long":204907,"short":37331,"net":167576,"pctLong":84.6,"oi":511276},{"date":"2025-03-18","sym":"GC","long":220879,"short":37045,"net":183834,"pctLong":85.6,"oi":533566},{"date":"2025-03-25","sym":"GC","long":213505,"short":38773,"net":174732,"pctLong":84.6,"oi":511482},{"date":"2025-04-01","sym":"GC","long":204833,"short":62834,"net":141999,"pctLong":76.5,"oi":498746},{"date":"2025-04-08","sym":"GC","long":175393,"short":44407,"net":130986,"pctLong":79.8,"oi":445468},{"date":"2025-04-15","sym":"GC","long":168400,"short":43546,"net":124854,"pctLong":79.5,"oi":456628},{"date":"2025-04-22","sym":"GC","long":166360,"short":45458,"net":120902,"pctLong":78.5,"oi":465351},{"date":"2025-04-29","sym":"GC","long":150715,"short":44820,"net":105895,"pctLong":77.1,"oi":451868},{"date":"2025-05-06","sym":"GC","long":144383,"short":42292,"net":102091,"pctLong":77.3,"oi":452414},{"date":"2025-05-13","sym":"GC","long":144410,"short":43183,"net":101227,"pctLong":77.0,"oi":440842},{"date":"2025-05-20","sym":"GC","long":149149,"short":41520,"net":107629,"pctLong":78.2,"oi":448000},{"date":"2025-05-27","sym":"GC","long":147502,"short":36686,"net":110816,"pctLong":80.1,"oi":437538},{"date":"2025-06-03","sym":"GC","long":159966,"short":36384,"net":123582,"pctLong":81.5,"oi":415941},{"date":"2025-06-10","sym":"GC","long":160680,"short":36589,"net":124091,"pctLong":81.5,"oi":417143},{"date":"2025-06-17","sym":"GC","long":167646,"short":37135,"net":130511,"pctLong":81.9,"oi":441214},{"date":"2025-06-24","sym":"GC","long":163829,"short":38701,"net":125128,"pctLong":80.9,"oi":434958},{"date":"2025-07-01","sym":"GC","long":165086,"short":34726,"net":130360,"pctLong":82.6,"oi":437662},{"date":"2025-07-08","sym":"GC","long":164685,"short":35743,"net":128942,"pctLong":82.2,"oi":443144},{"date":"2025-07-15","sym":"GC","long":172657,"short":35930,"net":136727,"pctLong":82.8,"oi":448531},{"date":"2025-07-22","sym":"GC","long":194753,"short":34819,"net":159934,"pctLong":84.8,"oi":489423},{"date":"2025-07-29","sym":"GC","long":170918,"short":36662,"net":134256,"pctLong":82.3,"oi":445259},{"date":"2025-08-05","sym":"GC","long":186304,"short":32317,"net":153987,"pctLong":85.2,"oi":449647},{"date":"2025-08-12","sym":"GC","long":182337,"short":34050,"net":148287,"pctLong":84.3,"oi":446152},{"date":"2025-08-19","sym":"GC","long":173388,"short":36003,"net":137385,"pctLong":82.8,"oi":438541},{"date":"2025-08-26","sym":"GC","long":175494,"short":33577,"net":141917,"pctLong":83.9,"oi":443760},{"date":"2025-09-02","sym":"GC","long":196127,"short":34625,"net":161502,"pctLong":85.0,"oi":492908},{"date":"2025-09-09","sym":"GC","long":198907,"short":35388,"net":163519,"pctLong":84.9,"oi":509625},{"date":"2025-09-16","sym":"GC","long":195347,"short":36376,"net":158971,"pctLong":84.3,"oi":516221},{"date":"2025-09-23","sym":"GC","long":198826,"short":38277,"net":160549,"pctLong":83.9,"oi":528789},{"date":"2025-09-30","sym":"GC","long":184199,"short":38972,"net":145227,"pctLong":82.5,"oi":493748},{"date":"2025-10-07","sym":"GC","long":170587,"short":40828,"net":129759,"pctLong":80.7,"oi":485559},{"date":"2025-10-14","sym":"GC","long":152187,"short":43877,"net":108310,"pctLong":77.6,"oi":485788},{"date":"2025-10-21","sym":"GC","long":135503,"short":43276,"net":92227,"pctLong":75.8,"oi":472421},{"date":"2025-10-28","sym":"GC","long":138605,"short":34446,"net":104159,"pctLong":80.1,"oi":457122},{"date":"2025-11-04","sym":"GC","long":130688,"short":30143,"net":100545,"pctLong":81.3,"oi":450399},{"date":"2025-11-10","sym":"GC","long":134155,"short":30068,"net":104087,"pctLong":81.7,"oi":459997},{"date":"2025-11-18","sym":"GC","long":130222,"short":32017,"net":98205,"pctLong":80.3,"oi":471953},{"date":"2025-11-25","sym":"GC","long":136979,"short":27670,"net":109309,"pctLong":83.2,"oi":432946},{"date":"2025-12-02","sym":"GC","long":140143,"short":19819,"net":120324,"pctLong":87.6,"oi":418490},{"date":"2025-12-09","sym":"GC","long":143383,"short":19835,"net":123548,"pctLong":87.8,"oi":432569},{"date":"2025-12-16","sym":"GC","long":152873,"short":20277,"net":132596,"pctLong":88.3,"oi":471093},{"date":"2025-12-23","sym":"GC","long":160581,"short":24311,"net":136270,"pctLong":86.9,"oi":492103},{"date":"2025-12-30","sym":"GC","long":148642,"short":22602,"net":126040,"pctLong":86.8,"oi":481866},{"date":"2026-01-06","sym":"GC","long":146445,"short":23232,"net":123213,"pctLong":86.3,"oi":488116},{"date":"2026-01-13","sym":"GC","long":158825,"short":24080,"net":134745,"pctLong":86.8,"oi":527455},{"date":"2026-01-20","sym":"GC","long":163668,"short":26224,"net":137444,"pctLong":86.2,"oi":528004},{"date":"2026-01-27","sym":"GC","long":143321,"short":25162,"net":118159,"pctLong":85.1,"oi":488463},{"date":"2026-02-03","sym":"GC","long":118936,"short":26864,"net":92072,"pctLong":81.6,"oi":409694},{"date":"2026-02-10","sym":"GC","long":119232,"short":27210,"net":92022,"pctLong":81.4,"oi":404391},{"date":"2026-02-17","sym":"GC","long":123011,"short":27118,"net":95893,"pctLong":81.9,"oi":407078},{"date":"2026-02-24","sym":"GC","long":121233,"short":25259,"net":95974,"pctLong":82.8,"oi":420182},{"date":"2026-03-03","sym":"GC","long":123456,"short":25539,"net":97917,"pctLong":82.9,"oi":409789},{"date":"2026-03-10","sym":"GC","long":125077,"short":26678,"net":98399,"pctLong":82.4,"oi":413956},{"date":"2026-03-17","sym":"GC","long":130147,"short":28104,"net":102043,"pctLong":82.2,"oi":411388},{"date":"2026-03-24","sym":"GC","long":119562,"short":27941,"net":91621,"pctLong":81.1,"oi":403925},{"date":"2026-03-31","sym":"GC","long":120092,"short":27278,"net":92814,"pctLong":81.5,"oi":361409},{"date":"2026-04-07","sym":"GC","long":120726,"short":30694,"net":90032,"pctLong":79.7,"oi":354877},{"date":"2026-04-14","sym":"GC","long":125422,"short":30281,"net":95141,"pctLong":80.6,"oi":362274},{"date":"2026-04-21","sym":"GC","long":123681,"short":30705,"net":92976,"pctLong":80.1,"oi":365842},{"date":"2026-04-28","sym":"GC","long":122257,"short":32505,"net":89752,"pctLong":79.0,"oi":369530},{"date":"2026-05-05","sym":"GC","long":123353,"short":29099,"net":94254,"pctLong":80.9,"oi":367932},{"date":"2026-05-12","sym":"GC","long":127242,"short":29227,"net":98015,"pctLong":81.3,"oi":376496},{"date":"2026-05-19","sym":"GC","long":122894,"short":29354,"net":93540,"pctLong":80.7,"oi":379325},{"date":"2026-05-26","sym":"GC","long":124277,"short":26831,"net":97446,"pctLong":82.2,"oi":353489},{"date":"2026-06-02","sym":"GC","long":129367,"short":17188,"net":112179,"pctLong":88.3,"oi":326052},{"date":"2026-06-09","sym":"GC","long":126280,"short":20417,"net":105863,"pctLong":86.1,"oi":332709},{"date":"2026-06-16","sym":"GC","long":128043,"short":14322,"net":113721,"pctLong":89.9,"oi":339330},{"date":"2025-01-07","sym":"NQ","long":37329,"short":76409,"net":-39080,"pctLong":32.8,"oi":241165},{"date":"2025-01-14","sym":"NQ","long":44226,"short":81635,"net":-37409,"pctLong":35.1,"oi":253879},{"date":"2025-01-21","sym":"NQ","long":40151,"short":80303,"net":-40152,"pctLong":33.3,"oi":254361},{"date":"2025-01-28","sym":"NQ","long":44031,"short":93956,"net":-49925,"pctLong":31.9,"oi":267882},{"date":"2025-02-04","sym":"NQ","long":42084,"short":90836,"net":-48752,"pctLong":31.7,"oi":259061},{"date":"2025-02-11","sym":"NQ","long":39736,"short":92040,"net":-52304,"pctLong":30.2,"oi":263509},{"date":"2025-02-18","sym":"NQ","long":40127,"short":108348,"net":-68221,"pctLong":27.0,"oi":289760},{"date":"2025-02-25","sym":"NQ","long":56135,"short":84006,"net":-27871,"pctLong":40.1,"oi":286114},{"date":"2025-03-04","sym":"NQ","long":66893,"short":78548,"net":-11655,"pctLong":46.0,"oi":288147},{"date":"2025-03-11","sym":"NQ","long":79012,"short":74346,"net":4666,"pctLong":51.5,"oi":303084},{"date":"2025-03-18","sym":"NQ","long":67212,"short":66155,"net":1057,"pctLong":50.4,"oi":301517},{"date":"2025-03-25","sym":"NQ","long":30225,"short":66115,"net":-35890,"pctLong":31.4,"oi":224189},{"date":"2025-04-01","sym":"NQ","long":48832,"short":79374,"net":-30542,"pctLong":38.1,"oi":247658},{"date":"2025-04-08","sym":"NQ","long":67920,"short":62300,"net":5620,"pctLong":52.2,"oi":254563},{"date":"2025-04-15","sym":"NQ","long":50242,"short":63635,"net":-13393,"pctLong":44.1,"oi":235406},{"date":"2025-04-22","sym":"NQ","long":55399,"short":55727,"net":-328,"pctLong":49.9,"oi":242084},{"date":"2025-04-29","sym":"NQ","long":51301,"short":77657,"net":-26356,"pctLong":39.8,"oi":246874},{"date":"2025-05-06","sym":"NQ","long":58695,"short":95365,"net":-36670,"pctLong":38.1,"oi":258249},{"date":"2025-05-13","sym":"NQ","long":63527,"short":117514,"net":-53987,"pctLong":35.1,"oi":283667},{"date":"2025-05-20","sym":"NQ","long":59596,"short":112289,"net":-52693,"pctLong":34.7,"oi":279368},{"date":"2025-05-27","sym":"NQ","long":59208,"short":106976,"net":-47768,"pctLong":35.6,"oi":275143},{"date":"2025-06-03","sym":"NQ","long":55854,"short":106034,"net":-50180,"pctLong":34.5,"oi":277034},{"date":"2025-06-10","sym":"NQ","long":57702,"short":98617,"net":-40915,"pctLong":36.9,"oi":276888},{"date":"2025-06-17","sym":"NQ","long":55516,"short":100288,"net":-44772,"pctLong":35.6,"oi":311779},{"date":"2025-06-24","sym":"NQ","long":48555,"short":80565,"net":-32010,"pctLong":37.6,"oi":253330},{"date":"2025-07-01","sym":"NQ","long":58273,"short":73957,"net":-15684,"pctLong":44.1,"oi":265393},{"date":"2025-07-08","sym":"NQ","long":58579,"short":69668,"net":-11089,"pctLong":45.7,"oi":270422},{"date":"2025-07-15","sym":"NQ","long":54088,"short":74562,"net":-20474,"pctLong":42.0,"oi":271661},{"date":"2025-07-22","sym":"NQ","long":49469,"short":73398,"net":-23929,"pctLong":40.3,"oi":270972},{"date":"2025-07-29","sym":"NQ","long":61680,"short":83165,"net":-21485,"pctLong":42.6,"oi":281762},{"date":"2025-08-05","sym":"NQ","long":58687,"short":73312,"net":-14625,"pctLong":44.5,"oi":277507},{"date":"2025-08-12","sym":"NQ","long":70831,"short":87121,"net":-16290,"pctLong":44.8,"oi":303576},{"date":"2025-08-19","sym":"NQ","long":56969,"short":75708,"net":-18739,"pctLong":42.9,"oi":289577},{"date":"2025-08-26","sym":"NQ","long":61174,"short":78075,"net":-16901,"pctLong":43.9,"oi":284355},{"date":"2025-09-02","sym":"NQ","long":64181,"short":82811,"net":-18630,"pctLong":43.7,"oi":282221},{"date":"2025-09-09","sym":"NQ","long":70821,"short":95846,"net":-25025,"pctLong":42.5,"oi":296970},{"date":"2025-09-16","sym":"NQ","long":75090,"short":99094,"net":-24004,"pctLong":43.1,"oi":351421},{"date":"2025-09-23","sym":"NQ","long":50088,"short":76172,"net":-26084,"pctLong":39.7,"oi":274695},{"date":"2025-09-30","sym":"NQ","long":61911,"short":63535,"net":-1624,"pctLong":49.4,"oi":278188},{"date":"2025-10-07","sym":"NQ","long":59939,"short":67153,"net":-7214,"pctLong":47.2,"oi":285401},{"date":"2025-10-14","sym":"NQ","long":53450,"short":58547,"net":-5097,"pctLong":47.7,"oi":278830},{"date":"2025-10-21","sym":"NQ","long":61437,"short":59393,"net":2044,"pctLong":50.8,"oi":289838},{"date":"2025-10-28","sym":"NQ","long":68182,"short":57008,"net":11174,"pctLong":54.5,"oi":299186},{"date":"2025-11-04","sym":"NQ","long":62702,"short":53572,"net":9130,"pctLong":53.9,"oi":292709},{"date":"2025-11-10","sym":"NQ","long":74313,"short":56694,"net":17619,"pctLong":56.7,"oi":296639},{"date":"2025-11-18","sym":"NQ","long":73714,"short":63331,"net":10383,"pctLong":53.8,"oi":299587},{"date":"2025-11-25","sym":"NQ","long":76011,"short":66340,"net":9671,"pctLong":53.4,"oi":296684},{"date":"2025-12-02","sym":"NQ","long":78215,"short":81255,"net":-3040,"pctLong":49.0,"oi":308211},{"date":"2025-12-09","sym":"NQ","long":76097,"short":97403,"net":-21306,"pctLong":43.9,"oi":325383},{"date":"2025-12-16","sym":"NQ","long":83876,"short":90850,"net":-6974,"pctLong":48.0,"oi":378693},{"date":"2025-12-23","sym":"NQ","long":60357,"short":75499,"net":-15142,"pctLong":44.4,"oi":265616},{"date":"2025-12-30","sym":"NQ","long":59039,"short":84713,"net":-25674,"pctLong":41.1,"oi":276539},{"date":"2026-01-06","sym":"NQ","long":60236,"short":78687,"net":-18451,"pctLong":43.4,"oi":274253},{"date":"2026-01-13","sym":"NQ","long":58656,"short":81404,"net":-22748,"pctLong":41.9,"oi":278878},{"date":"2026-01-20","sym":"NQ","long":54022,"short":81034,"net":-27012,"pctLong":40.0,"oi":267118},{"date":"2026-01-27","sym":"NQ","long":54689,"short":71527,"net":-16838,"pctLong":43.3,"oi":260759},{"date":"2026-02-03","sym":"NQ","long":58197,"short":69577,"net":-11380,"pctLong":45.5,"oi":268823},{"date":"2026-02-10","sym":"NQ","long":56269,"short":64870,"net":-8601,"pctLong":46.4,"oi":263282},{"date":"2026-02-17","sym":"NQ","long":63852,"short":73168,"net":-9316,"pctLong":46.6,"oi":272951},{"date":"2026-02-24","sym":"NQ","long":56133,"short":72687,"net":-16554,"pctLong":43.6,"oi":270599},{"date":"2026-03-03","sym":"NQ","long":55905,"short":77694,"net":-21789,"pctLong":41.8,"oi":273307},{"date":"2026-03-10","sym":"NQ","long":53057,"short":78224,"net":-25167,"pctLong":40.4,"oi":259842},{"date":"2026-03-17","sym":"NQ","long":51381,"short":82843,"net":-31462,"pctLong":38.3,"oi":300943},{"date":"2026-03-24","sym":"NQ","long":47003,"short":86382,"net":-39379,"pctLong":35.2,"oi":235906},{"date":"2026-03-31","sym":"NQ","long":47382,"short":84485,"net":-37103,"pctLong":35.9,"oi":245322},{"date":"2026-04-07","sym":"NQ","long":47521,"short":86349,"net":-38828,"pctLong":35.5,"oi":246794},{"date":"2026-04-14","sym":"NQ","long":44471,"short":94138,"net":-49667,"pctLong":32.1,"oi":260197},{"date":"2026-04-21","sym":"NQ","long":43848,"short":82848,"net":-39000,"pctLong":34.6,"oi":267620},{"date":"2026-04-28","sym":"NQ","long":45417,"short":81367,"net":-35950,"pctLong":35.8,"oi":275963},{"date":"2026-05-05","sym":"NQ","long":51944,"short":88044,"net":-36100,"pctLong":37.1,"oi":287657},{"date":"2026-05-12","sym":"NQ","long":47277,"short":99319,"net":-52042,"pctLong":32.2,"oi":287752},{"date":"2026-05-19","sym":"NQ","long":55696,"short":101067,"net":-45371,"pctLong":35.5,"oi":293186},{"date":"2026-05-26","sym":"NQ","long":52861,"short":104540,"net":-51679,"pctLong":33.6,"oi":302990},{"date":"2026-06-02","sym":"NQ","long":57156,"short":110806,"net":-53650,"pctLong":34.0,"oi":314972},{"date":"2026-06-09","sym":"NQ","long":68287,"short":102593,"net":-34306,"pctLong":40.0,"oi":305568},{"date":"2026-06-16","sym":"NQ","long":66996,"short":95150,"net":-28154,"pctLong":41.3,"oi":344441}];

const META = {
  GC: { name: "Gold", venue: "COMEX", cohort: "Managed Money", cfd: "XAUUSD" },
  NQ: { name: "Nasdaq-100", venue: "CME", cohort: "Leveraged Funds", cfd: "NAS100" },
};

const C = {
  bg: "#0b0f17", panel: "#121925", panel2: "#0e1521", border: "#222d3e",
  borderSoft: "#1a2433", text: "#d6deea", muted: "#6b7889", faint: "#46505f",
  long: "#26a69a", longSoft: "rgba(38,166,154,0.14)",
  short: "#ef5350", shortSoft: "rgba(239,83,80,0.14)",
  amber: "#e0a526",
};

const fmt = (n) => (n == null ? "—" : n.toLocaleString("en-US"));
const fmtSigned = (n) => (n == null ? "—" : (n > 0 ? "+" : "") + n.toLocaleString("en-US"));
const niceDate = (d) => {
  const [y, m, day] = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1];
  return `${mo} ${+day}, ${y}`;
};
const shortDate = (d) => {
  const [, m, day] = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1];
  return `${mo} ${+day}`;
};

function compute(sym) {
  const rows = COT_DATA.filter((r) => r.sym === sym).sort((a, b) => a.date.localeCompare(b.date));
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const nets = rows.map((r) => r.net);
  const min = Math.min(...nets), max = Math.max(...nets);
  const pos = (last.net - min) / (max - min); // 0..1 within full range
  const zeroPos = (0 - min) / (max - min);
  const change1w = last.net - prev.net;
  const isLong = last.net > 0;
  // is the crowd stretched? high in its own range -> stretched long; low -> stretched short
  let read;
  if (pos >= 0.85) read = { tag: "Crowded long", tone: "warn", note: "near the top of its 18-month range — historically stretched" };
  else if (pos <= 0.15) read = { tag: "Crowded short", tone: "warn", note: "near the bottom of its 18-month range — historically stretched" };
  else read = { tag: "Mid-range", tone: "neutral", note: "positioning sits in the middle of its 18-month range" };
  return { rows, last, prev, min, max, pos, zeroPos, change1w, isLong, read };
}

function Gauge({ s }) {
  const pct = (s.pos * 100).toFixed(0);
  const zeroPct = Math.max(0, Math.min(100, s.zeroPos * 100));
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, fontFamily: "ui-monospace, monospace", marginBottom: 6 }}>
        <span>18-mo low {fmt(s.min)}</span>
        <span>high {fmt(s.max)}</span>
      </div>
      <div style={{ position: "relative", height: 10, borderRadius: 6, background: `linear-gradient(90deg, ${C.shortSoft}, #1a2230 ${zeroPct}%, ${C.longSoft})`, border: `1px solid ${C.borderSoft}` }}>
        {/* zero line (long/short divide) if it falls inside the range */}
        {s.zeroPos > 0.02 && s.zeroPos < 0.98 && (
          <div style={{ position: "absolute", left: `${zeroPct}%`, top: -3, bottom: -3, width: 1, background: C.faint }} title="net flat (long = short)" />
        )}
        {/* current marker */}
        <div style={{ position: "absolute", left: `calc(${(s.pos * 100).toFixed(1)}% - 6px)`, top: -3, width: 12, height: 12, borderRadius: "50%", background: s.isLong ? C.long : C.short, boxShadow: `0 0 0 3px ${C.bg}, 0 0 10px ${s.isLong ? C.long : C.short}`, transition: "left .6s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 7, fontFamily: "ui-monospace, monospace" }}>
        now at <span style={{ color: s.read.tone === "warn" ? C.amber : C.muted }}>{pct}%</span> of range · {s.read.note}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, mode }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#0a0e16", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 11px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 3 }}>{niceDate(d.date)}</div>
      {mode === "net" ? (
        <>
          <div style={{ color: d.net >= 0 ? C.long : C.short }}>net {fmtSigned(d.net)}</div>
          <div style={{ color: C.faint, fontSize: 11 }}>L {fmt(d.long)} · S {fmt(d.short)}</div>
        </>
      ) : (
        <div style={{ color: d.pctLong >= 50 ? C.long : C.short }}>{d.pctLong}% long</div>
      )}
    </div>
  );
}

function HistoryChart({ s, mode }) {
  const key = mode === "net" ? "net" : "pctLong";
  const data = s.rows;
  const gid = `g_${key}_${Math.random().toString(36).slice(2, 7)}`;
  const baseline = mode === "net" ? 0 : 50;
  return (
    <div style={{ height: 150, marginTop: 14 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.isLong ? C.long : C.short} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.isLong ? C.long : C.short} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: C.faint, fontSize: 10, fontFamily: "ui-monospace, monospace" }} interval={Math.floor(data.length / 5)} axisLine={{ stroke: C.borderSoft }} tickLine={false} />
          <YAxis tick={{ fill: C.faint, fontSize: 10, fontFamily: "ui-monospace, monospace" }} width={38} tickFormatter={(v) => mode === "net" ? (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + "k" : v) : v + "%"} axisLine={false} tickLine={false} domain={mode === "pct" ? [20, 100] : ["auto", "auto"]} />
          <ReferenceLine y={baseline} stroke={C.faint} strokeDasharray="3 3" />
          <Tooltip content={<ChartTip mode={mode} />} />
          <Area type="monotone" dataKey={key} stroke={s.isLong ? C.long : C.short} strokeWidth={2} fill={`url(#${gid})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Panel({ sym, mode }) {
  const s = compute(sym);
  const m = META[sym];
  const accent = s.isLong ? C.long : C.short;
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, flex: "1 1 340px", minWidth: 300 }}>
      {/* header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 700, color: C.text }}>{m.name}</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.faint }}>{sym} · {m.venue}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.cohort} · trades as {m.cfd}</div>
        </div>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 700, color: accent, background: s.isLong ? C.longSoft : C.shortSoft, border: `1px solid ${accent}`, borderRadius: 6, padding: "3px 9px", whiteSpace: "nowrap" }}>
          {s.isLong ? "NET LONG" : "NET SHORT"}
        </span>
      </div>

      {/* big figures */}
      <div style={{ display: "flex", gap: 22, marginTop: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>Net position</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1.2 }}>{fmtSigned(s.last.net)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>% Long</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{s.last.pctLong}%</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>1-wk change</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: s.change1w >= 0 ? C.long : C.short, lineHeight: 1.2 }}>{fmtSigned(s.change1w)}</div>
        </div>
      </div>

      <Gauge s={s} />
      <HistoryChart s={s} mode={mode} />
    </div>
  );
}

export default function CotDashboard() {
  const [mode, setMode] = useState("net");
  const latestDate = useMemo(() => COT_DATA.reduce((a, r) => (r.date > a ? r.date : a), "0"), []);

  const Tab = ({ id, label }) => (
    <button onClick={() => setMode(id)} style={{
      fontFamily: "ui-monospace, monospace", fontSize: 12, cursor: "pointer",
      padding: "5px 12px", borderRadius: 7, border: `1px solid ${mode === id ? C.border : "transparent"}`,
      background: mode === id ? C.panel : "transparent", color: mode === id ? C.text : C.muted,
    }}>{label}</button>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "26px 20px", fontFamily: "system-ui, -apple-system, sans-serif", color: C.text }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: 2, color: C.amber, textTransform: "uppercase" }}>Market Data Hub</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0" }}>Smart-Money Positioning</h1>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Where the big speculators sit — and whether that's at an extreme.
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.faint }}>
            <div>CFTC · weekly</div>
            <div style={{ color: C.muted }}>latest {niceDate(latestDate)}</div>
          </div>
        </div>

        {/* view toggle */}
        <div style={{ display: "flex", gap: 4, margin: "16px 0 14px", padding: 4, background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 10, width: "fit-content" }}>
          <Tab id="net" label="Net position" />
          <Tab id="pct" label="% Long" />
        </div>

        {/* panels */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Panel sym="GC" mode={mode} />
          <Panel sym="NQ" mode={mode} />
        </div>

        {/* how to read */}
        <div style={{ background: C.panel2, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: "14px 18px", marginTop: 16, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>How to read it.</span> The marker shows where this week's net position sits inside its 18-month range.
          Near the <span style={{ color: C.amber }}>top or bottom</span> = the crowd is heavily one-sided, which historically precedes mean-reversion more often than continuation.
          This is <span style={{ color: C.text }}>slow context</span> (weekly, lagged) — a bias filter, never an entry trigger.
        </div>

        {/* footer / honesty */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 14, fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.faint }}>
          <span>Snapshot from cot_collector.py · {COT_DATA.length} weekly reports · free CFTC data</span>
          <span style={{ color: C.muted }}>Discipline filter, not trade signals · live-from-Supabase = next step</span>
        </div>
      </div>
    </div>
  );
}
