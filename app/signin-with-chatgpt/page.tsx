import { signIn } from "../../auth";
import { redirect } from "next/navigation";
import { safeRelativeReturnPath } from "../chatgpt-auth";
import { localTestingEnabled } from "../../lib/local-testing";

export default async function SignInPage({searchParams}:{searchParams:Promise<{return_to?:string}>}) {
  const {return_to} = await searchParams;
  const path = safeRelativeReturnPath(return_to || "/");
  if (localTestingEnabled()) redirect(path);
  return <main className="project-hub"><section className="panel system-error"><h1>Sign in to SearchScope</h1><p>Use your GitHub account to access your Vercel projects.</p><form action={async()=>{"use server";await signIn("github",{redirectTo:path});}}><button className="primary">Continue with GitHub</button></form></section></main>;
}
