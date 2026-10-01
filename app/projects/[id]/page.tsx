import ProjectWorkspace from '../../project-workspace';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {ownedProject} from '../../../lib/projects';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ProjectPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProjectData id={id}/>;}
async function ProjectData({id}:{id:string}){const user=await requireChatGPTUser('/projects/'+encodeURIComponent(id));let project;try{project=await ownedProject(id,user.userId);}catch{notFound();}return <ProjectWorkspace key={id} id={id} initialProject={project}/>;}
