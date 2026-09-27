export type TemplateId = 'editorial' | 'benefits' | 'story';
export type Ratio = '16:9' | '9:16' | '1:1';
export interface Brief { product: string; audience: string; benefits: string; style: string; duration: number; ratio: Ratio; template: TemplateId | 'auto'; cta: string }
export interface Scene { id: string; title: string; caption: string; direction: string; duration: number; assetId: string | null }
export interface Asset { id: string; name: string; url: string; width: number; height: number; size: number; createdAt: string }
export interface Decision { engine: 'jev' | 'local' | 'fallback'; message: string; template: TemplateId; confidence: number | null; model?: string; latencyMs?: number }
export interface Project { id: string; name: string; brief: Brief; scenes: Scene[]; decision: Decision; assets: Asset[]; createdAt: string; updatedAt: string; revision: number }
export interface ProjectSummary { id: string; name: string; updatedAt: string; sceneCount: number; ratio: Ratio; revision: number }
export interface RenderJob { id: string; projectId: string; revision: number; status: 'queued' | 'rendering' | 'complete' | 'failed'; stage: string; completedScenes: number; totalScenes: number; createdAt: string; error?: string; videoUrl?: string; packageUrl?: string; coverUrl?: string }
export interface Template { id: TemplateId; name: string; english: string; description: string; color: string; tag: string }
export const templates: Template[] = [
 { id:'editorial', name:'静物编辑部', english:'THE EDITORIAL', description:'留白、质感与克制的表达，让产品成为主角。', color:'#dbb480', tag:'生活方式 / 设计品牌' },
 { id:'benefits', name:'卖点直达', english:'THE ESSENTIALS', description:'从问题切入，清楚呈现价值，推动下一步。', color:'#aec4af', tag:'新品上架 / 效果广告' },
 { id:'story', name:'日常的一幕', english:'A LITTLE STORY', description:'用一个熟悉的场景，把产品放进真实生活。', color:'#b8bbd5', tag:'品牌故事 / 社交内容' },
];
export const sampleBrief: Brief = { product:'晨间陶杯', audience:'喜欢慢生活与设计感的都市青年', benefits:'温润哑光釉面\n舒服的弧形杯把\n适合咖啡、茶与每一个日常', style:'安静、温暖，有自然光的生活方式短片', duration:15, ratio:'16:9', template:'auto', cta:'给日常，留一点温度。' };
