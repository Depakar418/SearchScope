import ProjectWorkspace from '../../project-workspace';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {ownedProject} from '../../../lib/projects';
import {PublicError} from '../../../lib/app-errors';
import {SystemError} from '../../system-error';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ProjectPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProjectData id={id}/>;}
async function ProjectData({id}:{id:string}){const user=await requireChatGPTUser('/projects/'+encodeURIComponent(id));let project;try{project=await ownedProject(id,user.userId);}catch(e){if(e instanceof PublicError&&e.status===404)notFound();if(e instanceof PublicError)return <SystemError status={e.status} message={e.message}/>;throw e;}return <ProjectWorkspace key={id} id={id} initialProject={project}/>;}
