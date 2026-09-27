import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Desertarians Off Road Academy", description: "UAE off-road community, academy, club drives and camping adventures." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`(function(){try{var t=localStorage.getItem("desertarians-color-scheme");if(t==="enfitek"||t==="dark"){document.documentElement.dataset.theme=t}else{delete document.documentElement.dataset.theme}}catch(e){}})();`}} /></head><body><SiteHeader /><main className="site-main">{children}</main><SiteFooter /></body></html>;
}
