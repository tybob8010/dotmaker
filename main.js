// キャンバスとその2D描画コンテキストを取得
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ドットの1マスの大きさ
const dotSize = 16;

// ドットの色データを保持する2次元配列（初期は全て白）
const dots = Array.from({ length: canvas.height / dotSize }, () =>
  Array(canvas.width / dotSize).fill('#ffffff')
);

// 現在選択されている色（初期は黒）
let currentColor = '#000000';
let mouseDown = false; // マウスが押されているかどうか

// --------------------------
// 色選択スライダーの設定
// --------------------------
['r', 'g', 'b'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateColor);
});

function updateColor() {
  // RGBスライダーの値を取得して、currentColorを更新
  const r = document.getElementById('r').value;
  const g = document.getElementById('g').value;
  const b = document.getElementById('b').value;
  currentColor = `rgb(${r}, ${g}, ${b})`;
}
updateColor(); // 初期化時に色をセット

// --------------------------
// パレット機能
// --------------------------
const palette = []; // 最大10色まで保存
const paletteContainer = document.getElementById('paletteColors');

document.getElementById('saveToPalette').onclick = () => {
  if (palette.length < 10) {
    palette.push(currentColor); // 現在の色を保存
    renderPalette(); // 表示を更新
  }
};

function renderPalette() {
  // パレット表示の更新
  paletteContainer.innerHTML = '';
  palette.forEach(color => {
    const swatch = document.createElement('div');
    swatch.style.width = '24px';
    swatch.style.height = '24px';
    swatch.style.background = color;
    swatch.style.border = '1px solid black';
    swatch.style.cursor = 'pointer';
    swatch.onclick = () => {
      currentColor = color; // クリックで色を再選択
    };
    paletteContainer.appendChild(swatch);
  });
}

// --------------------------
// ドットの描画機能
// --------------------------
function drawDots() {
  // dots配列をすべてキャンバスに描画する
  for (let y = 0; y < dots.length; y++) {
    for (let x = 0; x < dots[y].length; x++) {
      ctx.fillStyle = dots[y][x];
      ctx.fillRect(x * dotSize, y * dotSize, dotSize, dotSize);
    }
  }
}

// マウスイベントで描画
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  if (!rectMode) drawAt(e); // 通常モードのみ
});
canvas.addEventListener('mousemove', e => {
  if (mouseDown && !rectMode) drawAt(e);
});
canvas.addEventListener('mouseup', () => mouseDown = false);

function drawAt(e) {
  // マウス座標をドット単位に変換し、色を塗る
  const x = Math.floor(e.offsetX / dotSize);
  const y = Math.floor(e.offsetY / dotSize);
  dots[y][x] = currentColor;
  drawDots();
}

// --------------------------
// 画像読み込み機能
// --------------------------
document.getElementById('imageLoader').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // クリア
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // キャンバスに描画
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

// --------------------------
// 選択＆移動機能
// --------------------------
let selection = null; // 選択状態
let draggingSelection = false; // 移動中かどうか
let selectionOffset = { x: 0, y: 0 }; // 選択内でのマウスのオフセット

// 選択・ドラッグ開始
canvas.addEventListener('mousedown', function(e) {
  if (rectMode) {
    rectStart = { x: Math.floor(e.offsetX / dotSize), y: Math.floor(e.offsetY / dotSize) };
    return;
  }

  const x = Math.floor(e.offsetX / dotSize);
  const y = Math.floor(e.offsetY / dotSize);

  if (selection &&
      x >= selection.x && x < selection.x + selection.w &&
      y >= selection.y && y < selection.y + selection.h) {
    // 選択範囲内クリック：移動開始
    draggingSelection = true;
    selectionOffset = { x: x - selection.x, y: y - selection.y };
  } else {
    // 新たな選択開始
    selection = { x, y, w: 0, h: 0, data: null };
    draggingSelection = false;
  }
});

// ドラッグ中の処理（移動または選択範囲表示）
canvas.addEventListener('mousemove', function(e) {
  if (!mouseDown || rectMode) return;

  const x = Math.floor(e.offsetX / dotSize);
  const y = Math.floor(e.offsetY / dotSize);

  if (draggingSelection && selection && selection.data) {
    // 選択範囲の移動表示
    const newX = x - selectionOffset.x;
    const newY = y - selectionOffset.y;
    drawDots(); // 再描画
    ctx.putImageData(selection.data, newX * dotSize, newY * dotSize);
  } else if (selection) {
    // 選択範囲のサイズを更新し、枠を表示
    selection.w = x - selection.x + 1;
    selection.h = y - selection.y + 1;
    drawDots();
    ctx.strokeStyle = '#000';
    ctx.strokeRect(selection.x * dotSize, selection.y * dotSize,
                   selection.w * dotSize, selection.h * dotSize);
  }
});

// マウスアップ：選択完了 or 移動完了
canvas.addEventListener('mouseup', function(e) {
  if (rectMode && rectStart) {
    // 四角塗りの処理
    const x2 = Math.floor(e.offsetX / dotSize);
    const y2 = Math.floor(e.offsetY / dotSize);
    const minX = Math.min(rectStart.x, x2);
    const minY = Math.min(rectStart.y, y2);
    const maxX = Math.max(rectStart.x, x2);
    const maxY = Math.max(rectStart.y, y2);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        dots[y][x] = currentColor;
      }
    }
    drawDots();
    rectStart = null;
    return;
  }

  if (selection && !draggingSelection) {
    // 選択範囲を画像として保存
    const sx = selection.x * dotSize;
    const sy = selection.y * dotSize;
    const sw = selection.w * dotSize;
    const sh = selection.h * dotSize;
    selection.data = ctx.getImageData(sx, sy, sw, sh);
  }

  if (draggingSelection && selection) {
    // 選択範囲の移動確定処理
    const x = Math.floor(e.offsetX / dotSize);
    const y = Math.floor(e.offsetY / dotSize);
    const newX = x - selectionOffset.x;
    const newY = y - selectionOffset.y;

    // 元の範囲を白で塗る
    for (let dy = 0; dy < selection.h; dy++) {
      for (let dx = 0; dx < selection.w; dx++) {
        dots[selection.y + dy][selection.x + dx] = '#ffffff';
      }
    }

    // 新しい位置に色データを反映
    const imageData = selection.data;
    const canvas2 = document.createElement('canvas');
    canvas2.width = imageData.width;
    canvas2.height = imageData.height;
    const ctx2 = canvas2.getContext('2d');
    ctx2.putImageData(imageData, 0, 0);
    const temp = ctx2.getImageData(0, 0, imageData.width, imageData.height).data;

    for (let y2 = 0; y2 < selection.h; y2++) {
      for (let x2 = 0; x2 < selection.w; x2++) {
        const idx = (y2 * imageData.width + x2) * 4;
        const r = temp[idx], g = temp[idx+1], b = temp[idx+2], a = temp[idx+3];
        if (a > 0) {
          dots[newY + y2][newX + x2] = `rgb(${r},${g},${b})`;
        }
      }
    }

    drawDots();
    selection = null;
    draggingSelection = false;
  }
});

// --------------------------
// 四角形塗りモード切り替え
// --------------------------
let rectMode = false;
let rectStart = null;

document.getElementById('rectFill').onclick = () => {
  rectMode = !rectMode;
  document.getElementById('rectFill').innerText = rectMode ? '通常モードに戻す' : '塗りモードにする';
};

// --------------------------
// 初期描画
// --------------------------
drawDots();
