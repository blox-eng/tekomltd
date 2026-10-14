const SCRIPT = `try{var v=localStorage.getItem("tekom-theme");if(v==="dark"||v==="light")document.documentElement.dataset.theme=v}catch(_){}`;

/** Runs in <head> before first paint, so the saved theme never flashes. */
export function ThemeScript() {
    return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
