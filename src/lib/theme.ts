export const THEME_STORAGE_KEY = "scada-theme";

export type Theme = "light" | "dark";

/**
 * Runs before first paint so the correct theme is on <html> already.
 * Without this the page renders light, then snaps to dark once React
 * hydrates, which is very visible on a dark background.
 *
 * Kept as a string because it has to be inlined into the document head.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;
