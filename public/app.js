const socket = io();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Saját pontfelhő
const particleCount = 1000;
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];

for (let i = 0; i < particleCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = 4;
    positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.8
});

const myParticleCloud = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(myParticleCloud);

// Minden kliens saját pozícióban
let myPosition = { x: 0, y: 0, z: 0 };

// Más kliensek
let others = {};

// Energiacsatornák (vonalak)
let connectionLines = [];

// Frissítjük az összes klienst és csatornát
socket.on('clientsUpdate', (clients) => {
    others = { ...clients };
    delete others[socket.id];

    // Előző vonalak törlése
    connectionLines.forEach(line => scene.remove(line));
    connectionLines = [];

    // Új vonalak létrehozása
    for (let id in others) {
        const otherPos = others[id].position;
        const points = [
            new THREE.Vector3(myPosition.x, myPosition.y, myPosition.z),
            new THREE.Vector3(otherPos.x, otherPos.y, otherPos.z)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
        const line = new THREE.Line(geometry, material);
        connectionLines.push(line);
        scene.add(line);
    }
});
const clock = new THREE.Clock();
let angle = 0;

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    angle += delta * 0.5; // forgási sebesség

    // Gömb mozgatása körpályán
    myParticleCloud.position.x = Math.cos(angle) * 5;
    myParticleCloud.position.z = Math.sin(angle) * 5;

    myParticleCloud.rotation.x += 0.002;
    myParticleCloud.rotation.y += 0.002;

    // Saját pozíció folyamatos küldése
    myPosition = {
        x: myParticleCloud.position.x,
        y: myParticleCloud.position.y,
        z: myParticleCloud.position.z
    };
    socket.emit('updatePosition', myPosition);

    renderer.render(scene, camera);
}
animate();
