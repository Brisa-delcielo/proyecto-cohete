// 1. INICIALIZACIÓN DEL CANVAS EN PANTALLA COMPLETA CON PIXEL RATIO OPTIMIZADO
const container = document.getElementById('canvas3d');
const canvas = document.createElement('canvas');
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
let isMobile = false;

function resize() {
    isMobile = window.innerWidth < 768;
    
    // Limitar el pixelRatio en móviles para garantizar 60 FPS suaves
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    
    width = canvas.width = window.innerWidth * dpr;
    height = canvas.height = window.innerHeight * dpr;
    
    // Escalar el contexto para mantener las coordenadas limpias
    ctx.scale(dpr, dpr);
    
    // Ancho/Alto lógico para cálculos 3D
    width = window.innerWidth;
    height = window.innerHeight;
    
    initStars();
}
window.addEventListener('resize', resize);

// GENERACIÓN DE CAMPO DE ESTRELLAS ADAPTATIVO
function initStars() {
    stars = [];
    const starCount = isMobile ? 70 : 150; // Reducimos estrellas en móviles para rendimiento
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + 0.4,
            alpha: Math.random(),
            speed: Math.random() * 0.015 + 0.005
        });
    }
}
resize();

// 2. GEOMETRÍA SÓLIDA DE LA NAVE (INTACTA)
const vertices = [
    // --- CABINA Y FUSELAJE ---
    {x: 0, y: -200, z: 0},       // 0: Punta
    {x: 0, y: -120, z: 25},      // 1: Cristal Ventana
    {x: -25, y: -100, z: 10},    // 2: Izq Cabina
    {x: 25, y: -100, z: 10},     // 3: Der Cabina
    {x: 0, y: -90, z: -20},      // 4: Dorsal/Espalda
    
    // --- CUERPO CENTRAL ---
    {x: -30, y: 40, z: 15},      // 5: Izq Centro
    {x: 30, y: 40, z: 15},       // 6: Der Centro
    {x: 0, y: 40, z: -25},       // 7: Espalda Centro
    
    // --- BASE Y TURBO ---
    {x: -20, y: 120, z: 10},     // 8: Base Izq
    {x: 20, y: 120, z: 10},      // 9: Base Der
    {x: 0, y: 120, z: -15},      // 10: Base Atrás
    {x: 0, y: 150, z: 0},        // 11: Escape del Turbo

    // --- ALAS DELTA 3D ---
    {x: -120, y: 90, z: -5},     // 12: Punta Ala Izq
    {x: 120, y: 90, z: -5},      // 13: Punta Ala Der
    
    // --- ALETA TRASERA (ESTABILIZADOR) ---
    {x: 0, y: 100, z: -55}       // 14: Punta Aleta Dorsal
];

const faces = [
    [0, 1, 2], [0, 3, 1], [0, 2, 4], [0, 4, 3],
    [1, 5, 2], [1, 3, 6], [1, 6, 5],
    [2, 5, 7], [2, 7, 4], [3, 4, 7], [3, 7, 6],
    [5, 8, 10], [5, 10, 7], [6, 7, 10], [6, 10, 9],
    [5, 6, 9], [5, 9, 8],
    [8, 11, 10], [9, 10, 11], [8, 9, 11],
    [2, 12, 5], [5, 12, 8], [2, 8, 12],
    [3, 6, 13], [6, 13, 9], [3, 13, 9],
    [4, 14, 7], [7, 14, 10], [4, 10, 14]
];

// 3. CONTROLES Y ARRASTRE TÁCTIL Y MOUSE
const canvasSection = document.querySelector('.canvas-section');
let rotX = 0.15;
let rotY = 0.4;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

canvasSection.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => { isDragging = false; });

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    rotY += (e.clientX - lastMouse.x) * 0.008;
    rotX += (e.clientY - lastMouse.y) * 0.008;
    lastMouse = { x: e.clientX, y: e.clientY };
});

// Eventos táctiles optimizados
canvasSection.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
}, { passive: true });

window.addEventListener('touchend', () => { isDragging = false; });

window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    rotY += (e.touches[0].clientX - lastMouse.x) * 0.008;
    rotX += (e.touches[0].clientY - lastMouse.y) * 0.008;
    lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

// 4. BUCLE DE RENDERIZADO FLUIDO
function render() {
    ctx.clearRect(0, 0, width, height);

    // DIBUJAR ESTRELLAS
    stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) {
            star.speed = -star.speed;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha) * 0.7})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    if (!isDragging) rotY += 0.006;

    // Centro del área de inspección 3D
    const rect = canvasSection.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // ESCALA ADAPTATIVA: 65% del tamaño normal si estamos en móvil
    const modelScale = isMobile ? 0.65 : 1.0;

    // Transformación y proyección 3D
    const projected = vertices.map(v => {
        let vx = v.x * modelScale;
        let vy = v.y * modelScale;
        let vz = v.z * modelScale;

        let x1 = vx * Math.cos(rotY) + vz * Math.sin(rotY);
        let z1 = -vx * Math.sin(rotY) + vz * Math.cos(rotY);
        let y2 = vy * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = vy * Math.sin(rotX) + z1 * Math.cos(rotX);

        const fov = 380;
        const scale = fov / (fov + z2 + 100);
        return {
            x: x1 * scale + cx,
            y: y2 * scale + cy,
            z: z2
        };
    });

    // Ordenamiento de caras por profundidad Z (Painter's Algorithm)
    const sortedFaces = faces.map(f => {
        const p1 = projected[f[0]];
        const p2 = projected[f[1]];
        const p3 = projected[f[2]];
        
        const zAvg = (p1.z + p2.z + p3.z) / 3;
        return { face: f, z: zAvg };
    }).sort((a, b) => b.z - a.z);

    // Dibujado de caras
    sortedFaces.forEach(item => {
        const f = item.face;
        const p1 = projected[f[0]];
        const p2 = projected[f[1]];
        const p3 = projected[f[2]];

        const shade = Math.min(240, Math.max(35, Math.floor(130 + item.z * 0.75)));
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();
    });

    requestAnimationFrame(render);
}
render();

// 5. CONTROL DE DESPLEGABLES (ACCORDIONS)
document.querySelectorAll('.acc-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const content = item.querySelector('.acc-content');
        const isActive = item.classList.contains('active');

        document.querySelectorAll('.acc-item').forEach(i => {
            i.classList.remove('active');
            const c = i.querySelector('.acc-content');
            if (c) c.style.maxHeight = null;
        });

        if (!isActive && content) {
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
        }
    });
});