onmessage = async (e) => {
  const { imgSrc, cell, th, colors } = e.data;
  const img = await loadImage(imgSrc);
  const { pts, w, h } = imageToGrid(img, cell, th);
  const svg = pointsToSVG(pts, w, h);
  const dst = buildDst(pts);
  postMessage({ svg, dst });
};

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function imageToGrid(img, cellSize, threshold) {
  const canvas = new OffscreenCanvas(200, Math.round(img.height / img.width * 200));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let pts = [];
  for (let y = 0; y < canvas.height; y += cellSize) {
    for (let x = 0; x < canvas.width; x += cellSize) {
      const i = (y * canvas.width + x) * 4;
      const g = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      if (g < threshold) pts.push({ x, y });
    }
  }
  return { pts, w: canvas.width, h: canvas.height };
}

function pointsToSVG(pts, w, h) {
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='white'/>`;
  for (const p of pts) {
    svg += `<circle cx='${p.x}' cy='${p.y}' r='1' fill='black'/>`;
  }
  svg += "</svg>";
  return svg;
}

function buildDst(pts) {
  let header = new Uint8Array(512);
  "LA:MOLFA\n".split("").forEach((ch, i) => (header[i] = ch.charCodeAt(0)));
  let data = [];
  let prev = { x: 0, y: 0 };
  for (const p of pts) {
    let dx = p.x - prev.x;
    let dy = p.y - prev.y;
    dx = Math.max(-127, Math.min(127, dx));
    dy = Math.max(-127, Math.min(127, dy));
    data.push(dx & 0xff, dy & 0xff, 0x00);
    prev = p;
  }
  data.push(0, 0, 0xf3); // End of file
  let arr = new Uint8Array(header.length + data.length);
  arr.set(header, 0);
  arr.set(data, 512);
  return arr.buffer;
    }
