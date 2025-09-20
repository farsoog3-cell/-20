const fileInput = document.getElementById("file");
const makeBtn = document.getElementById("make");
const spinner = document.getElementById("spinner");
const origImg = document.getElementById("orig");
const svgPreviewDiv = document.getElementById("svgPreview");
const downloadDstBtn = document.getElementById("downloadDst");
const downloadSvgBtn = document.getElementById("downloadSvg");

let lastDstBlob = null;
let lastSvgBlob = null;

const worker = new Worker("worker.js");

worker.onmessage = (e) => {
  const { svg, dst } = e.data;

  // SVG preview
  lastSvgBlob = new Blob([svg], { type: "image/svg+xml" });
  const imgSvg = document.createElement("img");
  imgSvg.src = URL.createObjectURL(lastSvgBlob);
  svgPreviewDiv.innerHTML = "";
  svgPreviewDiv.appendChild(imgSvg);

  // DST blob
  lastDstBlob = new Blob([dst], { type: "application/octet-stream" });

  // Show download buttons
  downloadDstBtn.style.display = "inline-block";
  downloadDstBtn.onclick = () => {
    const url = URL.createObjectURL(lastDstBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pattern.dst";
    a.click();
    URL.revokeObjectURL(url);
  };

  downloadSvgBtn.style.display = "inline-block";
  downloadSvgBtn.onclick = () => {
    const url = URL.createObjectURL(lastSvgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pattern.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  spinner.classList.add("hidden");
};

makeBtn.addEventListener("click", async () => {
  spinner.classList.remove("hidden");
  const f = fileInput.files[0];
  if (!f) {
    alert("اختر صورة أولا");
    spinner.classList.add("hidden");
    return;
  }
  const img = await readImageAsImg(f);
  origImg.src = img.src;

  const cell = parseInt(document.getElementById("cell").value);
  const th = parseInt(document.getElementById("th").value);
  const colors = parseInt(document.getElementById("colors").value);

  worker.postMessage({ imgSrc: img.src, cell, th, colors });
});

function readImageAsImg(f) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = (e) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = e.target.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(f);
  });
}
