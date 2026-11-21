import { defineConfig, type Plugin } from "vite";

// Streng innholdssikkerhetspolicy i det ferdige bygget: siden får bare snakke
// med GitHub, Anthropic og Google. Det beskytter nøkkelen mot fremmede skript.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src https://api.github.com https://raw.githubusercontent.com https://api.anthropic.com https://generativelanguage.googleapis.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

const cspPlugin = (): Plugin => ({
  name: "csp",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
});

export default defineConfig({ base: "./", plugins: [cspPlugin()] });
