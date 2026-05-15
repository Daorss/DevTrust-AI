import Icon from "./Icon";
// import gdgLogo from "../assets/GoogleDeveloperGroups.svg";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center h-16 px-gutter max-w-[1280px] mx-auto w-full">
        <div className="flex items-center gap-base">
          <Icon name="security" className="text-primary" />
          <span className="text-headline-md font-sans font-bold tracking-tight text-on-surface">
            DevTrust AI
          </span>
        </div>
        {/* <div className="flex items-center gap-base">
          <span className="inline-flex items-center bg-white rounded px-2 py-0.5 scale-150">
            <img src={gdgLogo} alt="Google Developer Groups" className="h-4" />
          </span>
        </div> */}
      </div>
    </nav>
  );
}
