import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { sampleBrief } from '../shared/types';
import type { Project, RenderJob } from '../shared/types';
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
test('独立工作室API：创建、持久化、版本冲突、上传、输入校验、真实视频成品包', {timeout:120000}, async(t)=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'.xtasy-director-test-'));
 const reserve=createServer();await new Promise<void>(resolve=>reserve.listen(0,'127.0.0.1',resolve));const address=reserve.address();if(typeof address==='string'||!address)throw new Error('port unavailable');const port=address.port;await new Promise<void>((resolve,reject)=>reserve.close(error=>error?reject(error):resolve()));
 const child=spawn(process.execPath,['--import','tsx','server/index.ts'],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'production',PORT:String(port),DATA_DIR:dir,TYPESAFE_API_KEY:'',HOST:'127.0.0.1'},stdio:'ignore'});
 const base=`http://127.0.0.1:${port}`;
 t.after(async()=>{child.kill('SIGTERM');await new Promise<void>(resolve=>{if(child.exitCode!==null)return resolve();child.once('close',()=>resolve());setTimeout(()=>{child.kill('SIGKILL');resolve();},3000).unref();});await fs.rm(dir,{recursive:true,force:true});});
 for(let tries=0;tries<100;tries++){try{if((await fetch(`${base}/api/health`)).ok)break;}catch{}if(tries===99)throw new Error('Test server did not start');await delay(100);}
 const health=await (await fetch(`${base}/api/health`)).json() as {ffmpeg:boolean;jevConfigured:boolean};assert.equal(health.jevConfigured,false);
 const create=await fetch(`${base}/api/projects`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...sampleBrief,template:'editorial',duration:10})});assert.equal(create.status,201);let project=await create.json() as Project;assert.equal(project.decision.engine,'local');assert.equal(project.assets.length,1);assert.equal(project.scenes[0]!.assetId,project.assets[0]!.id);assert.equal((await fetch(`${base}${project.assets[0]!.url}`)).status,200);
 const saved=JSON.parse(await fs.readFile(path.join(dir,'projects',`${project.id}.json`),'utf8')) as Project;assert.equal(saved.name,'晨间陶杯');
 const preview=await fetch(`${base}/api/projects/${project.id}/scenes/${project.scenes[0]!.id}/preview`);assert.equal(preview.status,200);assert.match(preview.headers.get('content-type')||'',/image\/jpeg/);
 const mutate={revision:project.revision,name:project.name,scenes:project.scenes.map((s,i)=>i===0?{...s,caption:'这是已保存的版本'}:s)};
 const update=await fetch(`${base}/api/projects/${project.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(mutate)});assert.equal(update.status,200);project=await update.json() as Project;
 const conflict=await fetch(`${base}/api/projects/${project.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(mutate)});assert.equal(conflict.status,409);
 const otherOrigin=await fetch(`${base}/api/projects`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify(sampleBrief)});assert.equal(otherOrigin.status,403);
 const invalid=await fetch(`${base}/api/projects`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(invalid.status,400);
 const badFile=new FormData();badFile.append('file',new Blob(['not-an-image'],{type:'text/html'}),'evil.html');const rejected=await fetch(`${base}/api/projects/${project.id}/assets`,{method:'POST',body:badFile});assert.equal(rejected.status,400);
 const png=await sharp({create:{width:32,height:32,channels:3,background:'#ccaa88'}}).png().toBuffer();const upload=new FormData();upload.append('file',new Blob([new Uint8Array(png)],{type:'image/png'}),'safe-image.png');const uploaded=await fetch(`${base}/api/projects/${project.id}/assets`,{method:'POST',body:upload});assert.equal(uploaded.status,201);project=(await uploaded.json() as {project:Project}).project;assert.equal(project.assets.length,2);
 const invalidAsset={revision:project.revision,name:project.name,scenes:project.scenes.map((s,i)=>i===0?{...s,assetId:'0eec8d10-9529-41e7-b18c-46b7acd4fd4c'}:s)};assert.equal((await fetch(`${base}/api/projects/${project.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(invalidAsset)})).status,400);
 const srt=await(await fetch(`${base}/api/projects/${project.id}/download/subtitles`)).text();assert.match(srt,/这是已保存的版本/);
 if(health.ffmpeg){const started=await fetch(`${base}/api/projects/${project.id}/render`,{method:'POST'});assert.equal(started.status,202);let job=await started.json() as RenderJob;assert.equal((await fetch(`${base}/api/projects/${project.id}/render`,{method:'POST'})).status,429);for(let tries=0;tries<180;tries++){job=await(await fetch(`${base}/api/jobs/${job.id}`)).json() as RenderJob;if(job.status==='complete'||job.status==='failed')break;await delay(300);}assert.equal(job.status,'complete',job.error);const video=await fetch(`${base}${job.videoUrl}`);assert.equal(video.status,200);const bytes=Buffer.from(await video.arrayBuffer());assert.ok(bytes.length>5000);assert.equal(bytes.subarray(4,8).toString(),'ftyp');const zip=await fetch(`${base}${job.packageUrl}`);const archive=Buffer.from(await zip.arrayBuffer());assert.equal(archive.subarray(0,2).toString(),'PK');assert.ok(archive.length>10000);assert.ok((await fs.stat(path.join(dir,'exports',job.id,'captions.srt'))).size>0);}else{t.diagnostic('FFmpeg 不可用，跳过视频编码验证；CI 与 Docker 会安装 FFmpeg。');}
});
