'use client';
import {SystemError} from './system-error';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="project-hub"><SystemError status={500} retry={reset}/></main>;}
