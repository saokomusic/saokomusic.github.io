// SAOKO Studio · Biblioteca de teléfonos.
//
// Medidas OFICIALES de cada fabricante (alto × ancho × grosor en mm, pantalla en pulgadas,
// resolución en píxeles y densidad). La pantalla se calcula a partir de la diagonal y la
// resolución reales, así cada teléfono tiene su proporción exacta.
//
// Para agregar un modelo nuevo basta con sumar un objeto a DEVICES (con sus datos oficiales).
// Lo que NO es una especificación (radio de las esquinas, forma del módulo de cámaras) es
// solo para dibujarlo parecido y no se muestra como dato técnico.

export const DEVICES = [
  // ---------------------------------------------------------------- Apple
  {
    id: "iphone-17-pro-max", name: "iPhone 17 Pro Max", brand: "Apple", os: "iOS", year: 2025,
    mm: { h: 163.4, w: 78.0, d: 8.75 }, inches: 6.9, res: [1320, 2868], ppi: 460,
    corner: 13.2, cutout: "island", camera: "plateau",
    colors: [{ name: "Naranja cósmico", hex: "#E0702F" }, { name: "Azul profundo", hex: "#2B3A55" }, { name: "Plata", hex: "#DCDDDF" }],
    frame: "alu",
  },
  {
    id: "iphone-17-pro", name: "iPhone 17 Pro", brand: "Apple", os: "iOS", year: 2025,
    mm: { h: 150.0, w: 71.9, d: 8.75 }, inches: 6.3, res: [1206, 2622], ppi: 460,
    corner: 12.6, cutout: "island", camera: "plateau",
    colors: [{ name: "Naranja cósmico", hex: "#E0702F" }, { name: "Azul profundo", hex: "#2B3A55" }, { name: "Plata", hex: "#DCDDDF" }],
    frame: "alu",
  },
  {
    id: "iphone-17", name: "iPhone 17", brand: "Apple", os: "iOS", year: 2025,
    mm: { h: 149.6, w: 71.5, d: 7.95 }, inches: 6.3, res: [1206, 2622], ppi: 460,
    corner: 12.6, cutout: "island", camera: "pill",
    colors: [{ name: "Negro", hex: "#2A2A2C" }, { name: "Blanco", hex: "#F2F1EE" }, { name: "Azul niebla", hex: "#A9BCD3" }, { name: "Salvia", hex: "#A7B59A" }, { name: "Lavanda", hex: "#C9B9DF" }],
    frame: "alu",
  },
  {
    id: "iphone-16-pro-max", name: "iPhone 16 Pro Max", brand: "Apple", os: "iOS", year: 2024,
    mm: { h: 163.0, w: 77.6, d: 8.25 }, inches: 6.9, res: [1320, 2868], ppi: 460,
    corner: 13.2, cutout: "island", camera: "pro-square",
    colors: [{ name: "Titanio negro", hex: "#3C3C3D" }, { name: "Titanio blanco", hex: "#E9E7E2" }, { name: "Titanio natural", hex: "#BFB7AA" }, { name: "Titanio desierto", hex: "#BFA48F" }],
    frame: "titanium",
  },
  {
    id: "iphone-16-pro", name: "iPhone 16 Pro", brand: "Apple", os: "iOS", year: 2024,
    mm: { h: 149.6, w: 71.5, d: 8.25 }, inches: 6.3, res: [1206, 2622], ppi: 460,
    corner: 12.6, cutout: "island", camera: "pro-square",
    colors: [{ name: "Titanio negro", hex: "#3C3C3D" }, { name: "Titanio blanco", hex: "#E9E7E2" }, { name: "Titanio natural", hex: "#BFB7AA" }, { name: "Titanio desierto", hex: "#BFA48F" }],
    frame: "titanium",
  },
  {
    id: "iphone-16", name: "iPhone 16", brand: "Apple", os: "iOS", year: 2024,
    mm: { h: 147.6, w: 71.6, d: 7.80 }, inches: 6.1, res: [1179, 2556], ppi: 460,
    corner: 12.3, cutout: "island", camera: "pill",
    colors: [{ name: "Negro", hex: "#2E2E30" }, { name: "Blanco", hex: "#F3F2EF" }, { name: "Rosa", hex: "#EFC3D3" }, { name: "Verde azulado", hex: "#9CC7C3" }, { name: "Ultramarino", hex: "#7C8CE0" }],
    frame: "alu",
  },
  {
    id: "iphone-15-pro-max", name: "iPhone 15 Pro Max", brand: "Apple", os: "iOS", year: 2023,
    mm: { h: 159.9, w: 76.7, d: 8.25 }, inches: 6.7, res: [1290, 2796], ppi: 460,
    corner: 13.0, cutout: "island", camera: "pro-square",
    colors: [{ name: "Titanio negro", hex: "#3D3E40" }, { name: "Titanio blanco", hex: "#E8E6E1" }, { name: "Titanio azul", hex: "#3F4A5C" }, { name: "Titanio natural", hex: "#BDB6AA" }],
    frame: "titanium",
  },
  {
    id: "iphone-15-pro", name: "iPhone 15 Pro", brand: "Apple", os: "iOS", year: 2023,
    mm: { h: 146.6, w: 70.6, d: 8.25 }, inches: 6.1, res: [1179, 2556], ppi: 460,
    corner: 12.3, cutout: "island", camera: "pro-square",
    colors: [{ name: "Titanio negro", hex: "#3D3E40" }, { name: "Titanio blanco", hex: "#E8E6E1" }, { name: "Titanio azul", hex: "#3F4A5C" }, { name: "Titanio natural", hex: "#BDB6AA" }],
    frame: "titanium",
  },
  // ---------------------------------------------------------------- Samsung
  {
    id: "galaxy-s25-ultra", name: "Galaxy S25 Ultra", brand: "Samsung", os: "Android", year: 2025,
    mm: { h: 162.8, w: 77.6, d: 8.2 }, inches: 6.9, res: [1440, 3120], ppi: 498,
    corner: 9.5, cutout: "punch", camera: "ultra-rings",
    colors: [{ name: "Titanium Silverblue", hex: "#8E9AAE" }, { name: "Titanium Black", hex: "#2E2F31" }, { name: "Titanium Gray", hex: "#8C8B88" }, { name: "Titanium Whitesilver", hex: "#E3E2DE" }],
    frame: "titanium",
  },
  {
    id: "galaxy-s25-plus", name: "Galaxy S25+", brand: "Samsung", os: "Android", year: 2025,
    mm: { h: 158.4, w: 75.8, d: 7.3 }, inches: 6.7, res: [1440, 3120], ppi: 513,
    corner: 11.5, cutout: "punch", camera: "rings3",
    colors: [{ name: "Navy", hex: "#2D3550" }, { name: "Icyblue", hex: "#BFD2E6" }, { name: "Mint", hex: "#C8E2D4" }, { name: "Silver Shadow", hex: "#C7C8CB" }],
    frame: "alu",
  },
  {
    id: "galaxy-s25", name: "Galaxy S25", brand: "Samsung", os: "Android", year: 2025,
    mm: { h: 146.9, w: 70.5, d: 7.2 }, inches: 6.2, res: [1080, 2340], ppi: 416,
    corner: 11.0, cutout: "punch", camera: "rings3",
    colors: [{ name: "Navy", hex: "#2D3550" }, { name: "Icyblue", hex: "#BFD2E6" }, { name: "Mint", hex: "#C8E2D4" }, { name: "Silver Shadow", hex: "#C7C8CB" }],
    frame: "alu",
  },
  {
    id: "galaxy-s24-ultra", name: "Galaxy S24 Ultra", brand: "Samsung", os: "Android", year: 2024,
    mm: { h: 162.3, w: 79.0, d: 8.6 }, inches: 6.8, res: [1440, 3120], ppi: 505,
    corner: 4.5, cutout: "punch", camera: "ultra-rings",
    colors: [{ name: "Titanium Black", hex: "#2F3032" }, { name: "Titanium Gray", hex: "#8F8D88" }, { name: "Titanium Violet", hex: "#7E7690" }, { name: "Titanium Yellow", hex: "#E6D6A4" }],
    frame: "titanium",
  },
  // ---------------------------------------------------------------- Google
  {
    id: "pixel-9-pro-xl", name: "Pixel 9 Pro XL", brand: "Google", os: "Android", year: 2024,
    mm: { h: 162.8, w: 76.6, d: 8.5 }, inches: 6.8, res: [1344, 2992], ppi: 486,
    corner: 12.0, cutout: "punch", camera: "visor",
    colors: [{ name: "Obsidian", hex: "#2C2D2F" }, { name: "Porcelain", hex: "#EDE7DD" }, { name: "Hazel", hex: "#8E9586" }, { name: "Rose Quartz", hex: "#EBCFD0" }],
    frame: "alu",
  },
  {
    id: "pixel-9-pro", name: "Pixel 9 Pro", brand: "Google", os: "Android", year: 2024,
    mm: { h: 152.8, w: 72.0, d: 8.5 }, inches: 6.3, res: [1280, 2856], ppi: 495,
    corner: 11.5, cutout: "punch", camera: "visor",
    colors: [{ name: "Obsidian", hex: "#2C2D2F" }, { name: "Porcelain", hex: "#EDE7DD" }, { name: "Hazel", hex: "#8E9586" }, { name: "Rose Quartz", hex: "#EBCFD0" }],
    frame: "alu",
  },
  {
    id: "pixel-9", name: "Pixel 9", brand: "Google", os: "Android", year: 2024,
    mm: { h: 152.8, w: 72.0, d: 8.5 }, inches: 6.3, res: [1080, 2424], ppi: 422,
    corner: 11.5, cutout: "punch", camera: "visor",
    colors: [{ name: "Obsidian", hex: "#2C2D2F" }, { name: "Porcelain", hex: "#EDE7DD" }, { name: "Wintergreen", hex: "#B8D3BF" }, { name: "Peony", hex: "#F0B8C8" }],
    frame: "alu",
  },
];

export const byId = Object.fromEntries(DEVICES.map((d) => [d.id, d]));

/** Medidas de la pantalla (mm) a partir de la diagonal y la resolución oficiales. */
export function screenMm(dev) {
  const [pw, ph] = dev.res;
  const diag = dev.inches * 25.4;
  const w = diag / Math.sqrt(1 + (ph / pw) ** 2);
  return { w, h: (w * ph) / pw };
}

/** Capturas de SAOKO (1080 × 2312) para poner en las pantallas. Rutas desde la raíz del sitio. */
const S = (id, label) => ({ id, label, src: "/img/hd/" + id + ".webp" });
export const SCREENS = [
  S("inicio", "Inicio"), S("reproductor", "Reproductor"), S("reproductor-video", "Video"), S("letras", "Letras"),
  S("radio", "SAOKO RADIO"), S("radio-emisora", "Radio en vivo"), S("ia", "SAOKO IA"), S("karaoke", "SAOKARAOKE"),
  S("karaoke-letra", "Karaoke letra"), S("karaoke-youtube", "Karaokes de YouTube"), S("karaoke-opciones", "Opciones de karaoke"),
  S("mix", "MIX"), S("mix-crear", "Crear MIX"), S("mix-transicion", "MIX transición"), S("mix-sonidos", "Sonidos de entrada"),
  S("chat", "SAOKO Chat"), S("rachas", "Juego de Rachas"), S("recap-portada", "Recap"), S("recap-minutos", "Recap minutos"),
  S("recap-cancion", "Recap canción"), S("recap-top", "Recap top"), S("recap-artista", "Recap artista"), S("recap-perfil", "Recap perfil"),
  S("recap-resumen", "Recap resumen"), S("biblioteca", "Biblioteca"), S("inicio-listas", "Tus listas"),
  S("widget-letras", "Widget letras"), S("widget-reproductor", "Widget reproductor"),
];
