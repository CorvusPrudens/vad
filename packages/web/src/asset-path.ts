let basePath = "";
if (typeof document !== "undefined") {
  const currentScript = window.document.currentScript as HTMLScriptElement | null;

  if (currentScript) {
    basePath = currentScript.src
      .replace(/#.*$/, "")
      .replace(/\?.*$/, "")
      .replace(/\/[^\/]+$/, "/")
  }
}

export const assetPath = (file: string) => {
  return basePath + file
}
