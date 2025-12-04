import { getSiteSettings } from "@/lib/data/settings";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const settings = await getSiteSettings();

  return <NavbarClient settings={settings} />;
}
