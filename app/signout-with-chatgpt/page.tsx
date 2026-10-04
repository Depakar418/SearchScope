import { signOut } from "../../auth";

export default function SignOutPage(){return <main className="project-hub"><section className="panel system-error"><h1>Sign out of SearchScope</h1><form action={async()=>{"use server";await signOut({redirectTo:"/"});}}><button className="primary">Sign out</button></form></section></main>;}
