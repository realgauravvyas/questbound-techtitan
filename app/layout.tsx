import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 metadataBase: new URL('https://questbound-techtitan.tender-elm-5517.chatgpt.site'),
 title: 'Questbound — Make every day an adventure | TechTitan',
 description: 'Turn everyday tasks into quests. Earn XP, grow your character, build streaks, and unlock rewards in Questbound, the Life RPG by TechTitan.',
 applicationName:'Questbound',
 openGraph:{title:'Questbound — Your life. Your next chapter.',description:'A real-life quest journal. Small steps, meaningful growth.',type:'website'},
 icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},
 robots:{index:true,follow:true},
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}
