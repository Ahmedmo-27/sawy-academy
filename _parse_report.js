const fs = require("fs");
const j = require("./Ahmedmo-27-sawy-academy-analysis-report.json");
const out = {};
out.metadata = j.metadata;
out.summary = j.summary;
out.resultKeys = Object.keys(j.results || {});
out.sast = (j.results.sast || []).map(x => ({sev:x.severity,file:x.file_path,line:x.line_number,title:String(x.title).slice(0,120)}));
out.secrets = (j.results.secrets || []).map(x => ({sev:x.severity||x.confidence,file:x.file_path,line:x.line_number,title:String(x.title||x.type||x.description||"").slice(0,150),keys:Object.keys(x)}));
const sca = j.results.sca || j.results.vulnerabilities || [];
out.scaSample = Array.isArray(sca) ? sca.slice(0,25).map(x => ({sev:x.severity,pkg:x.package||x.package_name||x.name,cve:x.cve||x.id,title:String(x.title||x.vulnerability||"").slice(0,100),keys:Object.keys(x).slice(0,15)})) : Object.keys(sca);
out.sastBySev = {};
for (const x of j.results.sast || []) { out.sastBySev[x.severity] = (out.sastBySev[x.severity] || 0) + 1; }
out.sastCount = (j.results.sast || []).length;
out.fpCount = (j.results.sast_false_positives || []).length;
for (const k of ["dead_code","complex_functions","duplicate_code","antipatterns","docstrings_absent","sbom","infrastructure"]) {
  const v = j.results[k];
  if (!v) { out[k] = "missing"; continue; }
  if (Array.isArray(v)) out[k] = {count:v.length, sample:v.slice(0,5).map(x => ({file:x.file_path||x.file, title:String(x.title||x.name||x.type||JSON.stringify(x)).slice(0,100), keys:Object.keys(x).slice(0,10)}))};
  else out[k] = {keys:Object.keys(v), preview:JSON.stringify(v).slice(0,500)};
}
const text = JSON.stringify(out, null, 2);
fs.writeFileSync("_parse_out.json", text);
process.stdout.write(text);
