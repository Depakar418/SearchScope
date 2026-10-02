import {requireChatGPTUser} from '../chatgpt-auth';
import {AccountProfile} from '../account-profile';
export const dynamic='force-dynamic';
export default async function Profile(){await requireChatGPTUser('/profile');return <AccountProfile/>;}
