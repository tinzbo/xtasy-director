import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Project, ProjectSummary } from '../shared/types';
import { uuidSchema } from './schema';
export const DATA_DIR=path.resolve(process.env.DATA_DIR||'.local');
export const PROJECT_DIR=path.join(DATA_DIR,'projects');
export const ASSET_DIR=path.join(DATA_DIR,'assets');
export const EXPORT_DIR=path.join(DATA_DIR,'exports');
export async function initStore():Promise<void>{await Promise.all([PROJECT_DIR,ASSET_DIR,EXPORT_DIR].map(p=>fs.mkdir(p,{recursive:true})));}
export function safeId(value:unknown):string{return uuidSchema.parse(value);}
export async function readProject(id:string):Promise<Project>{return JSON.parse(await fs.readFile(path.join(PROJECT_DIR,`${safeId(id)}.json`),'utf8')) as Project;}
export async function saveProject(project:Project):Promise<void>{const destination=path.join(PROJECT_DIR,`${safeId(project.id)}.json`);const temp=`${destination}.${randomUUID()}.tmp`;await fs.writeFile(temp,JSON.stringify(project,null,2),{mode:0o600});await fs.rename(temp,destination);}
export async function listProjects():Promise<ProjectSummary[]>{const entries=await fs.readdir(PROJECT_DIR);const records=await Promise.all(entries.filter(x=>x.endsWith('.json')).map(async name=>{const p=await readProject(name.slice(0,-5));return{id:p.id,name:p.name,updatedAt:p.updatedAt,sceneCount:p.scenes.length,ratio:p.brief.ratio,revision:p.revision};}));return records.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
const locks=new Set<string>();
export async function withProjectLock<T>(id:string,fn:()=>Promise<T>):Promise<T>{if(locks.has(id))throw Object.assign(new Error('项目正在更新，请稍后重试'),{status:409});locks.add(id);try{return await fn();}finally{locks.delete(id);}}
