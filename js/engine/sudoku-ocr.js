/**
 * SudokuOCR - Motor de Visión Artificial y Reconocimiento Óptico de Caracteres (OCR)
 * 100% en el Navegador para Sudoku Arena (Zero-Server, Client-Side, PWA)
 */

class SudokuOCR {
  constructor() {
    this.tesseractWorker = null;
    this.isInitializingWorker = false;
    this.workerReady = false;
    this.GRID_SIZE = 450;
    this.CELL_SIZE = 50;
  }

  async initWorker(progressCallback = null) {
    if (this.workerReady && this.tesseractWorker) return true;
    if (this.isInitializingWorker) {
      while (this.isInitializingWorker) {
        await new Promise(r => setTimeout(r, 100));
      }
      return this.workerReady;
    }

    this.isInitializingWorker = true;
    try {
      if (typeof window.Tesseract === 'undefined') {
        await this._loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
      }

      if (progressCallback) progressCallback(10, 'Iniciando motor de visión...');

      this.tesseractWorker = await window.Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (progressCallback && m.status === 'recognizing text') {
            const p = 40 + Math.floor((m.progress || 0) * 50);
            progressCallback(p, `Reconociendo dígitos: ${Math.floor((m.progress || 0) * 100)}%`);
          }
        }
      });

      await this.tesseractWorker.setParameters({
        tessedit_char_whitelist: '123456789',
        tessedit_pageseg_mode: window.Tesseract.PSM.SINGLE_CHAR
      });

      this.workerReady = true;
      if (progressCallback) progressCallback(30, 'Motor OCR preparado.');
      return true;
    } catch (e) {
      console.warn('Tesseract no disponible, usando clasificador local:', e);
      this.workerReady = false;
      return false;
    } finally {
      this.isInitializingWorker = false;
    }
  }

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (window.Tesseract) return resolve();
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  async loadImageToCanvas(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas);
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada.'));

      if (typeof source === 'string') {
        img.src = source;
      } else if (source instanceof File || source instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(source);
      } else if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
        img.src = source.toDataURL ? source.toDataURL() : source.src;
      } else {
        reject(new Error('Formato de imagen no soportado.'));
      }
    });
  }

  preprocessAdaptiveThreshold(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const gray = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }

    const intImg = new Float64Array(w * h);
    for (let y = 0; y < h; y++) {
      let sum = 0;
      for (let x = 0; x < w; x++) {
        sum += gray[y * w + x];
        if (y === 0) {
          intImg[y * w + x] = sum;
        } else {
          intImg[y * w + x] = intImg[(y - 1) * w + x] + sum;
        }
      }
    }

    const s = Math.max(8, Math.floor(w / 16));
    const s2 = Math.floor(s / 2);
    const T = 0.15;

    const binaryCanvas = document.createElement('canvas');
    binaryCanvas.width = w;
    binaryCanvas.height = h;
    const bCtx = binaryCanvas.getContext('2d');
    const outImgData = bCtx.createImageData(w, h);
    const outData = outImgData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const x1 = Math.max(0, x - s2);
        const x2 = Math.min(w - 1, x + s2);
        const y1 = Math.max(0, y - s2);
        const y2 = Math.min(h - 1, y + s2);
        const count = (x2 - x1) * (y2 - y1);

        const sum = intImg[y2 * w + x2]
                  - (y1 > 0 ? intImg[(y1 - 1) * w + x2] : 0)
                  - (x1 > 0 ? intImg[y2 * w + (x1 - 1)] : 0)
                  + (y1 > 0 && x1 > 0 ? intImg[(y1 - 1) * w + (x1 - 1)] : 0);

        const idx = y * w + x;
        const val = gray[idx];
        const isDark = (val * count) < (sum * (1.0 - T));

        const pixelIdx = idx * 4;
        const c = isDark ? 0 : 255;
        outData[pixelIdx] = c;
        outData[pixelIdx + 1] = c;
        outData[pixelIdx + 2] = c;
        outData[pixelIdx + 3] = 255;
      }
    }

    bCtx.putImageData(outImgData, 0, 0);
    return binaryCanvas;
  }

  detectGridCorners(canvas) {
    const w = canvas.width;
    const h = canvas.height;

    const marginX = Math.round(w * 0.05);
    const marginY = Math.round(h * 0.05);
    const size = Math.min(w - marginX * 2, h - marginY * 2);
    const startX = Math.round((w - size) / 2);
    const startY = Math.round((h - size) / 2);

    const defaultCorners = {
      tl: { x: startX, y: startY },
      tr: { x: startX + size, y: startY },
      br: { x: startX + size, y: startY + size },
      bl: { x: startX, y: startY + size }
    };

    try {
      const binCanvas = this.preprocessAdaptiveThreshold(canvas);
      const bCtx = binCanvas.getContext('2d');
      const data = bCtx.getImageData(0, 0, w, h).data;

      const horizProj = new Int32Array(h);
      const vertProj = new Int32Array(w);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4] === 0) {
            horizProj[y]++;
            vertProj[x]++;
          }
        }
      }

      const minLineLength = Math.round(w * 0.25);
      let top = 0, bottom = h - 1, left = 0, right = w - 1;

      for (let y = Math.round(h * 0.02); y < h * 0.4; y++) {
        if (horizProj[y] >= minLineLength) { top = y; break; }
      }
      for (let y = Math.round(h * 0.98); y > h * 0.6; y--) {
        if (horizProj[y] >= minLineLength) { bottom = y; break; }
      }

      const minVertLength = Math.round(h * 0.25);
      for (let x = Math.round(w * 0.02); x < w * 0.4; x++) {
        if (vertProj[x] >= minVertLength) { left = x; break; }
      }
      for (let x = Math.round(w * 0.98); x > w * 0.6; x--) {
        if (vertProj[x] >= minVertLength) { right = x; break; }
      }

      const boxW = right - left;
      const boxH = bottom - top;
      if (boxW > w * 0.3 && boxH > h * 0.3 && Math.abs(boxW - boxH) / Math.max(boxW, boxH) < 0.25) {
        return {
          tl: { x: left, y: top },
          tr: { x: right, y: top },
          br: { x: right, y: bottom },
          bl: { x: left, y: bottom }
        };
      }
    } catch (e) {
      console.warn('Autodetección fallback:', e);
    }

    return defaultCorners;
  }

  warpPerspective(sourceCanvas, corners, outputSize = this.GRID_SIZE) {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outputSize;
    outCanvas.height = outputSize;
    const outCtx = outCanvas.getContext('2d');

    const srcCtx = sourceCanvas.getContext('2d');
    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;
    const srcImgData = srcCtx.getImageData(0, 0, srcW, srcH);
    const srcData = srcImgData.data;

    const outImgData = outCtx.createImageData(outputSize, outputSize);
    const outData = outImgData.data;

    const { tl, tr, br, bl } = corners;

    for (let y = 0; y < outputSize; y++) {
      const v = y / (outputSize - 1);
      const leftX = tl.x + (bl.x - tl.x) * v;
      const leftY = tl.y + (bl.y - tl.y) * v;
      const rightX = tr.x + (br.x - tr.x) * v;
      const rightY = tr.y + (br.y - tr.y) * v;

      for (let x = 0; x < outputSize; x++) {
        const u = x / (outputSize - 1);
        const srcX = Math.round(leftX + (rightX - leftX) * u);
        const srcY = Math.round(leftY + (rightY - leftY) * u);

        const outIdx = (y * outputSize + x) * 4;
        if (srcX >= 0 && srcX < srcW && srcY >= 0 && srcY < srcH) {
          const srcIdx = (srcY * srcW + srcX) * 4;
          outData[outIdx] = srcData[srcIdx];
          outData[outIdx + 1] = srcData[srcIdx + 1];
          outData[outIdx + 2] = srcData[srcIdx + 2];
          outData[outIdx + 3] = 255;
        } else {
          outData[outIdx] = 255;
          outData[outIdx + 1] = 255;
          outData[outIdx + 2] = 255;
          outData[outIdx + 3] = 255;
        }
      }
    }

    outCtx.putImageData(outImgData, 0, 0);
    return outCanvas;
  }

  extractCells(warpedCanvas) {
    const cellSize = this.CELL_SIZE;
    const margin = Math.round(cellSize * 0.16);
    const innerSize = cellSize - margin * 2;

    const binCanvas = this.preprocessAdaptiveThreshold(warpedCanvas);

    const cells = [];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellCanvas = document.createElement('canvas');
        cellCanvas.width = innerSize;
        cellCanvas.height = innerSize;
        const cellCtx = cellCanvas.getContext('2d');

        const sx = c * cellSize + margin;
        const sy = r * cellSize + margin;

        cellCtx.drawImage(binCanvas, sx, sy, innerSize, innerSize, 0, 0, innerSize, innerSize);

        const cellData = cellCtx.getImageData(0, 0, innerSize, innerSize).data;
        let darkPixels = 0;
        const totalPixels = innerSize * innerSize;

        for (let i = 0; i < cellData.length; i += 4) {
          if (cellData[i] === 0) {
            darkPixels++;
          }
        }

        const darkRatio = darkPixels / totalPixels;
        const isEmpty = darkRatio < 0.045 || darkRatio > 0.70;

        cells.push({
          row: r,
          col: c,
          canvas: cellCanvas,
          isEmpty,
          darkRatio
        });
      }
    }

    return cells;
  }

  classifyDigitLocally(cellCanvas) {
    const w = cellCanvas.width;
    const h = cellCanvas.height;
    const ctx = cellCanvas.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h).data;

    let minX = w, maxX = 0, minY = h, maxY = 0;
    let darkCount = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4] === 0) {
          darkCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (darkCount < 20 || maxX <= minX || maxY <= minY) {
      return 0;
    }

    const digitW = maxX - minX + 1;
    const digitH = maxY - minY + 1;
    const aspectRatio = digitW / digitH;

    if (aspectRatio < 0.42) {
      return 1;
    }

    let topDark = 0, midDark = 0, botDark = 0;
    const midY1 = minY + Math.floor(digitH / 3);
    const midY2 = minY + Math.floor((digitH * 2) / 3);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (data[(y * w + x) * 4] === 0) {
          if (y < midY1) topDark++;
          else if (y < midY2) midDark++;
          else botDark++;
        }
      }
    }

    const holes = this._countHoles(cellCanvas, minX, maxX, minY, maxY);

    if (holes === 2) return 8;

    if (holes === 1) {
      const holeY = this._getHoleCenterY(cellCanvas, minX, maxX, minY, maxY);
      const relY = (holeY - minY) / digitH;
      if (relY > 0.55) return 6;
      if (relY < 0.45) return 9;
      return 4;
    }

    if (topDark > botDark * 1.5 && aspectRatio < 0.75) {
      return 7;
    }

    let leftDark = 0, rightDark = 0;
    const midX = minX + Math.floor(digitW / 2);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (data[(y * w + x) * 4] === 0) {
          if (x < midX) leftDark++;
          else rightDark++;
        }
      }
    }

    if (botDark > topDark && leftDark > rightDark) return 2;
    if (rightDark > leftDark * 1.3) return 3;
    return 5;
  }

  _countHoles(canvas, minX, maxX, minY, maxY) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h).data;

    const visited = new Uint8Array(w * h);
    const queue = [];

    for (let x = 0; x < w; x++) queue.push([x, 0], [x, h - 1]);
    for (let y = 0; y < h; y++) queue.push([0, y], [w - 1, y]);

    while (queue.length > 0) {
      const [qx, qy] = queue.pop();
      const idx = qy * w + qx;
      if (visited[idx] || qx < 0 || qx >= w || qy < 0 || qy >= h) continue;
      if (data[idx * 4] === 0) continue;

      visited[idx] = 1;
      queue.push([qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]);
    }

    let holes = 0;
    for (let y = minY + 2; y <= maxY - 2; y++) {
      for (let x = minX + 2; x <= maxX - 2; x++) {
        const idx = y * w + x;
        if (!visited[idx] && data[idx * 4] !== 0) {
          let holePixels = 0;
          const hQueue = [[x, y]];
          while (hQueue.length > 0) {
            const [hx, hy] = hQueue.pop();
            const hIdx = hy * w + hx;
            if (visited[hIdx] || hx < minX || hx > maxX || hy < minY || hy > maxY) continue;
            if (data[hIdx * 4] === 0) continue;

            visited[hIdx] = 2;
            holePixels++;
            hQueue.push([hx + 1, hy], [hx - 1, hy], [hx, hy + 1], [hx, hy - 1]);
          }
          if (holePixels >= 4) holes++;
        }
      }
    }
    return holes;
  }

  _getHoleCenterY(canvas, minX, maxX, minY, maxY) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h).data;

    let sumY = 0, count = 0;
    for (let y = minY + 2; y <= maxY - 2; y++) {
      for (let x = minX + 2; x <= maxX - 2; x++) {
        const idx = y * w + x;
        if (data[idx * 4] !== 0) {
          let leftWall = false, rightWall = false;
          for (let k = x - 1; k >= minX; k--) {
            if (data[(y * w + k) * 4] === 0) { leftWall = true; break; }
          }
          for (let k = x + 1; k <= maxX; k++) {
            if (data[(y * w + k) * 4] === 0) { rightWall = true; break; }
          }
          if (leftWall && rightWall) {
            sumY += y;
            count++;
          }
        }
      }
    }
    return count > 0 ? sumY / count : (minY + maxY) / 2;
  }

  async recognizeGrid(warpedCanvas, progressCallback = null) {
    const cells = this.extractCells(warpedCanvas);
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    const confidenceGrid = Array.from({ length: 9 }, () => Array(9).fill(1.0));

    const hasTesseract = await this.initWorker(progressCallback);
    const nonEmptyCells = cells.filter(c => !c.isEmpty);
    const totalToProcess = nonEmptyCells.length;
    let processed = 0;

    if (progressCallback) {
      progressCallback(35, `Analizando ${totalToProcess} casillas con números detectados...`);
    }

    for (const cell of cells) {
      if (cell.isEmpty) {
        grid[cell.row][cell.col] = 0;
        confidenceGrid[cell.row][cell.col] = 1.0;
        continue;
      }

      let digit = 0;
      let conf = 0.8;

      if (hasTesseract && this.tesseractWorker) {
        try {
          const scaled = document.createElement('canvas');
          scaled.width = 60;
          scaled.height = 60;
          const sCtx = scaled.getContext('2d');
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, 60, 60);
          sCtx.drawImage(cell.canvas, 6, 6, 48, 48);

          const res = await this.tesseractWorker.recognize(scaled);
          const text = (res.data.text || '').trim();
          const match = text.match(/[1-9]/);
          if (match) {
            digit = parseInt(match[0], 10);
            conf = (res.data.confidence || 80) / 100;
          }
        } catch (e) {
          digit = this.classifyDigitLocally(cell.canvas);
          conf = 0.75;
        }
      } else {
        digit = this.classifyDigitLocally(cell.canvas);
        conf = 0.85;
      }

      grid[cell.row][cell.col] = digit;
      confidenceGrid[cell.row][cell.col] = conf;

      processed++;
      if (progressCallback && totalToProcess > 0) {
        const pct = 35 + Math.floor((processed / totalToProcess) * 60);
        progressCallback(pct, `Reconociendo casilla ${processed} de ${totalToProcess}...`);
      }
    }

    if (progressCallback) {
      progressCallback(100, 'Reconocimiento finalizado con éxito.');
    }

    return { grid, confidenceGrid, warpedCanvas };
  }

  
  getSampleSudoku() {
    return [
      [0, 0, 0, 6, 0, 0, 4, 0, 0],
      [7, 0, 0, 0, 0, 3, 6, 0, 0],
      [0, 0, 0, 0, 9, 1, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 1, 8, 0, 0, 0, 3],
      [0, 0, 0, 3, 0, 6, 0, 4, 5],
      [0, 4, 0, 2, 0, 0, 0, 6, 0],
      [9, 0, 3, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 1, 0, 0]
    ];
  }

  generateSampleSudokuCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 600, 600);

    const offset = 40;
    const boardSize = 520;
    const cellSize = boardSize / 9;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(offset, offset, boardSize, boardSize);

    // Reto de Periódico Nivel Difícil (28 pistas)
    const sampleDigits = [
      [0, 0, 0, 6, 0, 0, 4, 0, 0],
      [7, 0, 0, 0, 0, 3, 6, 0, 0],
      [0, 0, 0, 0, 9, 1, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 1, 8, 0, 0, 0, 3],
      [0, 0, 0, 3, 0, 6, 0, 4, 5],
      [0, 4, 0, 2, 0, 0, 0, 6, 0],
      [9, 0, 3, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 1, 0, 0]
    ];

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = sampleDigits[r][c];
        if (val !== 0) {
          const cx = offset + c * cellSize + cellSize / 2;
          const cy = offset + r * cellSize + cellSize / 2;
          ctx.fillText(String(val), cx, cy);
        }
      }
    }

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 9; i++) {
      if (i % 3 !== 0) {
        ctx.beginPath();
        ctx.moveTo(offset + i * cellSize, offset);
        ctx.lineTo(offset + i * cellSize, offset + boardSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offset, offset + i * cellSize);
        ctx.lineTo(offset + boardSize, offset + i * cellSize);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    for (let i = 0; i <= 9; i += 3) {
      ctx.beginPath();
      ctx.moveTo(offset + i * cellSize, offset);
      ctx.lineTo(offset + i * cellSize, offset + boardSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offset, offset + i * cellSize);
      ctx.lineTo(offset + boardSize, offset + i * cellSize);
      ctx.stroke();
    }

    return canvas;
  }
}

if (typeof window !== 'undefined') {
  window.SudokuOCR = SudokuOCR;
}
