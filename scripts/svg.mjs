// Small helpers shared by the card, banner and GPU renderers.

export const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

// GitHub linguist colours.
export const LANGUAGE_COLORS = {
  "C++": "#f34b7d",
  Rust: "#dea584",
  Nix: "#7e7eff",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  JavaScript: "#f1e05a",
  Svelte: "#ff3e00",
  QML: "#44a51c",
  Kotlin: "#a97bff",
  Swift: "#f05138",
  C: "#555555",
  Shell: "#89e051",
};
