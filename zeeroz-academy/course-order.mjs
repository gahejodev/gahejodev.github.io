const gradeRank={IX:0,X:1,XI:2,XII:3};const natural=new Intl.Collator("en",{numeric:true,sensitivity:"base"});
function titleOf(v){return typeof v==="string"?v:String(v?.title||v?.name||v?.id||"")}
export function getGrade(v){const s=typeof v==="string"?v:[v?.title,v?.id,v?.grade,v?.level].filter(Boolean).join(" ");const m=String(s).match(/\b(XII|XI|IX|X)\b/i);return m?m[1].toUpperCase():""}
export function getSubject(v){return titleOf(v).split(/[—–-]/,1)[0].replace(/\b(?:GRADE\s*)?(?:XII|XI|IX|X)\b/gi,"").replace(/\s+/g," ").trim()||"Other"}
export function getSequenceNumber(v){const s=titleOf(v),m=s.match(/\b(?:chapter|unit|domain|part|lesson)\s*(?:no\.?\s*)?[-:#]?\s*(\d+)\b/i)||s.match(/^\s*(\d+)\s*[.)-]/);return m?Number(m[1]):null}
function explicit(v){const n=Number(v?.order);return Number.isFinite(n)&&n>0?n:null}
export function compareSequence(a,b){const ao=explicit(a),bo=explicit(b);if(ao!==null&&bo!==null&&ao!==bo)return ao-bo;if(ao!==null&&bo===null)return -1;if(ao===null&&bo!==null)return 1;const an=getSequenceNumber(a),bn=getSequenceNumber(b);if(an!==null&&bn!==null&&an!==bn)return an-bn;if(an!==null&&bn===null)return -1;if(an===null&&bn!==null)return 1;return natural.compare(titleOf(a),titleOf(b))}
export function compareCoursePackages(a,b){const gd=(gradeRank[getGrade(a)]??99)-(gradeRank[getGrade(b)]??99);if(gd)return gd;const sd=natural.compare(getSubject(a),getSubject(b));return sd||compareSequence(a,b)}
export function sortCoursePackages(items){return Array.from(items||[]).sort(compareCoursePackages)}
export function sortSequence(items){return Array.from(items||[]).sort(compareSequence)}
