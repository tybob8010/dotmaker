// ドット絵エディタのメインスクリプト

// --- 初期設定 ---
// ドットの列数・行数
let cols = 16, rows = 16;
// ドット絵データ（2次元配列）
// 未塗りは color: null（透明）で管理
let pixels = [];
// 現在選択中の色（HSBとRGB両方管理）
let currentColor = {h:0, s:100, b:100, r:255, g:0, b2:0};
// 消しゴムモードのフラグ
let eraserMode = false;

// キャンバス要素とその描画コンテキストを取得
const canvas = document.getElementById('dotCanvas');
const ctx = canvas.getContext('2d');

// --- HSB→RGB変換関数 ---
function hsbToRgb(h, s, v) {
    s /= 100; v /= 100;
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r=0,g=0,b=0;
    if (0 <= h && h < 60) [r,g,b] = [c,x,0];
    else if (60 <= h && h < 120) [r,g,b] = [x,c,0];
    else if (120 <= h && h < 180) [r,g,b] = [0,c,x];
    else if (180 <= h && h < 240) [r,g,b] = [0,x,c];
    else if (240 <= h && h < 300) [r,g,b] = [x,0,c];
    else if (300 <= h && h < 360) [r,g,b] = [c,0,x];
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

// --- RGB→HSB変換関数 ---
function rgbToHsb(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) h = 0;
    else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        b: Math.round(v * 100)
    };
}

// --- 色プレビューを更新する関数 ---
function updateColorPreview() {
    const rgb = hsbToRgb(currentColor.h, currentColor.s, currentColor.b);
    document.getElementById('colorPreview').style.background = rgb(${rgb.r},${rgb.g},${rgb.b});
}

// --- HSBスライダーから色を設定する関数 ---
function setColorFromHSB() {
    currentColor.h = parseInt(document.getElementById('hue').value);
    currentColor.s = parseInt(document.getElementById('sat').value);
    currentColor.b = parseInt(document.getElementById('bri').value);
    const rgb = hsbToRgb(currentColor.h, currentColor.s, currentColor.b);
    document.getElementById('r').value = rgb.r;
    document.getElementById('g').value = rgb.g;
    document.getElementById('b').value = rgb.b;
    updateColorPreview();
}

// --- RGB入力欄から色を設定する関数 ---
function setColorFromRGB() {
    currentColor.r = parseInt(document.getElementById('r').value);
    currentColor.g = parseInt(document.getElementById('g').value);
    currentColor.b2 = parseInt(document.getElementById('b').value);
    const hsb = rgbToHsb(currentColor.r, currentColor.g, currentColor.b2);
    document.getElementById('hue').value = hsb.h;
    document.getElementById('sat').value = hsb.s;
    document.getElementById('bri').value = hsb.b;
    currentColor.h = hsb.h;
    currentColor.s = hsb.s;
    currentColor.b = hsb.b;
    updateColorPreview();
}

// --- ドット絵データを初期化する関数 ---
function initPixels() {
    pixels = [];
    for (let y = 0; y < rows; y++) {
        let row = [];
        for (let x = 0; x < cols; x++) {
            row.push({ color: null }); // 未塗りはnull（透明）
        }
        pixels.push(row);
    }
}

// --- キャンバスにドット絵を描画する関数 ---
// 表示は常に1ドット=20px固定
function drawCanvas() {
    const displayPixelSize = 20; // 表示用の1ドットの大きさ
    canvas.width = cols * displayPixelSize;
    canvas.height = rows * displayPixelSize;
    // 透明部分をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (pixels[y][x].color) {
                ctx.fillStyle = pixels[y][x].color;
                ctx.fillRect(x * displayPixelSize, y * displayPixelSize, displayPixelSize, displayPixelSize);
            }
            // グリッド線
            ctx.strokeStyle = "#ccc";
            ctx.strokeRect(x * displayPixelSize, y * displayPixelSize, displayPixelSize, displayPixelSize);
        }
    }
}

// --- キャンバス上でクリックしたときの処理 ---
canvas.addEventListener('mousedown', function(e) {
    const displayPixelSize = 20; // 表示用の1ドットの大きさ
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / displayPixelSize);
    const y = Math.floor((e.clientY - rect.top) / displayPixelSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        if (eraserMode) {
            // 消しゴムモードなら透明（null）にする
            pixels[y][x].color = null;
        } else {
            // 通常は選択中の色で塗る
            const rgb = hsbToRgb(currentColor.h, currentColor.s, currentColor.b);
            pixels[y][x].color = rgb(${rgb.r},${rgb.g},${rgb.b});
        }
        drawCanvas();
    }
});

// --- 消しゴムボタンの処理 ---
document.getElementById('eraserBtn').onclick = function() {
    eraserMode = !eraserMode;
    document.getElementById('eraserStatus').textContent = eraserMode ? "消しゴムON" : "";
    this.style.background = eraserMode ? "#ffd" : "";
};

// --- リサイズボタンを押したときの処理 ---
document.getElementById('resizeBtn').onclick = function() {
    cols = parseInt(document.getElementById('cols').value);
    rows = parseInt(document.getElementById('rows').value);
    // 既存のドットデータはそのまま維持
    // サイズ変更時、既存データを保持しつつ拡張・縮小
    const newPixels = [];
    for (let y = 0; y < rows; y++) {
        let row = [];
        for (let x = 0; x < cols; x++) {
            if (pixels[y] && pixels[y][x]) {
                row.push({ color: pixels[y][x].color });
            } else {
                row.push({ color: null });
            }
        }
        newPixels.push(row);
    }
    pixels = newPixels;
    drawCanvas();
};

// --- HSB→RGB変換ボタン ---
document.getElementById('hsb2rgb').onclick = setColorFromHSB;
// --- RGB→HSB変換ボタン ---
document.getElementById('rgb2hsb').onclick = setColorFromRGB;

// --- HSBスライダーの値が変わったとき ---
['hue','sat','bri'].forEach(id => {
    document.getElementById(id).addEventListener('input', setColorFromHSB);
});
// --- RGB入力欄の値が変わったとき ---
['r','g','b'].forEach(id => {
    document.getElementById(id).addEventListener('input', setColorFromRGB);
});

// --- 保存ボタンを押したときの処理 ---
// 1ドットの大きさは保存時の拡大率として使う
document.getElementById('saveBtn').onclick = function() {
    const type = document.getElementById('fileType').value;
    const savePixelSize = parseInt(document.getElementById('pixelSize').value); // 保存時の1ドットの大きさ

    // 一時的な拡大用canvasを作成
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = cols * savePixelSize;
    tmpCanvas.height = rows * savePixelSize;
    const tmpCtx = tmpCanvas.getContext('2d');

    // 透明部分をクリア
    tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);

    // 各ドットを拡大して描画
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (pixels[y][x].color) {
                tmpCtx.fillStyle = pixels[y][x].color;
                tmpCtx.fillRect(x * savePixelSize, y * savePixelSize, savePixelSize, savePixelSize);
            }
        }
    }

    let mime = 'image/png';
    if (type === 'jpeg') mime = 'image/jpeg';
    if (type === 'ico') mime = 'image/x-icon';
    const url = tmpCanvas.toDataURL(mime);
    const a = document.createElement('a');
    a.href = url;
    a.download = dot.${type};
    a.click();
};

// --- 初期化処理 ---
initPixels();
drawCanvas();
setColorFromHSB();
updateColorPreview();
