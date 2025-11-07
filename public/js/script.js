const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');

let socket;
let backend_uri = "https://k-oso-radar-backend-production.up.railway.app/"

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let pixelsPerKm = parseInt(document.getElementById('scaleBase').value);
let radarRangeKm = parseInt(document.getElementById('rangeKm').value);

let offsetX = 0, offsetY = 0;
let scale = 1;
const minScale = 0.5, maxScale = 5;

let points = [];
let radarAngle = 0; // ángulo del haz animado

// Polar → Cartesiano
function polarToCartesian(r, angleDegrees) {
    const angle = angleDegrees * Math.PI / 180;
    const cx = width / 2;
    const cy = height / 2;
    return {
        x: cx + r * Math.sin(angle),
        y: cy - r * Math.cos(angle)
    };
}

// Cartesiano → Polar
function cartesianToPolar(x, y) {
    const cx = width / 2;
    const cy = height / 2;
    const dx = x - cx;
    const dy = cy - y;
    const r = Math.sqrt(dx*dx + dy*dy) / pixelsPerKm; // convertir a km
    let theta = Math.atan2(dx, dy) * 180 / Math.PI;
    if (theta < 0) theta += 360;
    return {r, theta};
}

/**
 * Calcula el rumbo complementario/opuesto de un ángulo en grados.
 * @param {number} heading - Rumbo actual (0-360)
 * @returns {number} Rumbo complementario (0-360)
 */
 function complementaryHeading(heading) {
    if (typeof heading !== 'number' || isNaN(heading)) {
        throw new Error('El rumbo debe ser un número válido');
    }

    // Normalizamos el rumbo a 0-360
    const normalized = ((heading % 360) + 360) % 360;

    // El rumbo complementario está 180° opuesto
    const complement = (normalized + 180) % 360;

    return complement;
}

// Dibujar radar
function drawRadar() {
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.clearRect(-offsetX/scale, -offsetY/scale, width/scale, height/scale);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadiusPx = radarRangeKm * pixelsPerKm;

    // Fondo
    ctx.fillStyle = 'black';
    ctx.fillRect(-offsetX/scale, -offsetY/scale, width/scale, height/scale);

    // Círculos concéntricos cada 5 km hasta el alcance máximo
    ctx.strokeStyle = 'rgba(0,255,0,0.3)';
    ctx.fillStyle = 'lime';
    ctx.font = "12px monospace";
    for (let rKm = 5; rKm <= radarRangeKm; rKm += 5) { 
        ctx.beginPath();
        ctx.arc(cx, cy, rKm * pixelsPerKm, 0, 2*Math.PI);
        ctx.stroke();
        ctx.fillText(`${rKm} km`, cx + rKm * pixelsPerKm + 5, cy - 5);
    }

    // Cruz central
    ctx.strokeStyle = 'rgba(0,255,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxRadiusPx); ctx.lineTo(cx, cy + maxRadiusPx); // Vertical
    ctx.moveTo(cx - maxRadiusPx, cy); ctx.lineTo(cx + maxRadiusPx, cy); // Horizontal
    ctx.stroke();

    // Etiquetas cardinales (colocadas en el borde del alcance)
    ctx.fillStyle = 'white';
    ctx.font = "bold 16px monospace";
    ctx.fillText("N", cx - 5, cy - maxRadiusPx - 10);
    ctx.fillText("S", cx - 5, cy + maxRadiusPx + 20);
    ctx.fillText("E", cx + maxRadiusPx + 10, cy + 5);
    ctx.fillText("W", cx - maxRadiusPx - 25, cy + 5);

    // Punto central
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2*Math.PI);
    ctx.fill();

    // Puntos rojos (solo si están dentro del alcance)
    points.forEach(p => {
        if (p.rKm <= radarRangeKm) {
            const pos = polarToCartesian(p.rKm * pixelsPerKm, p.angle);
            ctx.fillStyle = p.color || '#777777'; // si no hay color, usa rojo por defecto
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, 2*Math.PI);
            ctx.fill();
        }
    });

    // Haz del radar (recortado al alcance máximo)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadiusPx, 0, 2*Math.PI);
    ctx.clip();

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadiusPx);
    grad.addColorStop(0, "rgba(0,255,0,0.4)");
    grad.addColorStop(1, "rgba(0,255,0,0)");
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxRadiusPx, (radarAngle-1)*Math.PI/180, (radarAngle+1)*Math.PI/180);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

// Animación
function animate() {
    radarAngle = (radarAngle + 1) % 360;
    drawRadar();
    requestAnimationFrame(animate);
}

function sesionState(ok){
    document.getElementById('sesion').style.backgroundColor = ok ? 'white' : '#FFC7C7';
}

function sesionEnabled(ok){
    document.getElementById('sesion').disabled = !ok;
    document.getElementById('newSesion').disabled = !ok;
}

document.getElementById('sesion').addEventListener('click', () => {
    const sesion = document.getElementById("sesion").value.trim();
    if (sesion) socket.emit("obtener_puntos", sesion, (error, records) => {
        // Limpiar puntos locales y redibujar
        points = [];
        drawRadar();
        if(error){
            console.error(error.error);
            sesionState(false);
            return;
        } else{
            sesionState(true);
        }

        console.log(records);
        
        records.forEach((data) => {
            // Añado el nuevo punto al radar
            points.push(data.punto);
        });
    });

});

// Crear nueva sesión
document.getElementById('newSesion').addEventListener('click', () => {
    const sesionAnterior = document.getElementById("sesion").value.trim()
    socket.emit("new_sesion", ( error,idSesion ) => {
        if (error) {
            console.error("Error creando sesión:", error);
            return;
        }

        // Cambiamos la sesión actual
        document.getElementById("sesion").value = idSesion;

        if(sesionAnterior){
            // 🔹 Limpiar puntos locales
            points = [];

            // 🔹 Redibujar el radar vacío
            drawRadar();
            sesionState(true);
            console.log(`Nueva sesión creada: ${idSesion}. Radar reseteado.`);
        } else {
            // En el caso de no haber sesión de usuario,
            // se sincronizarán los puntos locales con la nueva sesión (para no perderlos)
            points.forEach( ( punto ) => {
                const data = { 
                    sesion: idSesion,
                    punto
                }
                enviarPuntoAlServidor(data);
            });
        }
    });
});

// Agregar punto TO (en km hacia el cluster desde el VOR)
document.getElementById('addToPoint').addEventListener('click', () => {
    agregarPunto(complementaryHeading(parseFloat(document.getElementById('angle').value)));
});

// Agregar punto FROM (en km desde el cluster hasta el VOR)
document.getElementById('addFromPoint').addEventListener('click', () => {
    // Simplemente le paso el rumbo del cajetín
    agregarPunto(parseFloat(document.getElementById('angle').value));
});

// Se agrega el punto siguiendo el águlo del radial FROM (desde el centro hasta el punto)
function agregarPunto(angle){
    const r = parseFloat(document.getElementById('distance').value);
    const note = document.getElementById('note').value.slice(0,255);
    const color = document.getElementById('pointColor').value;
    const user = document.getElementById('user').value;
    
    // Se pasa el radio del círculo a dibujar (importante para luego saber si se clica o no en el pq no es posible event DOM)
    const punto = {rKm: r, angle, radius_circulo: 6, note, color, user};
    
    const data = { 
        sesion: document.getElementById("sesion").value.trim(),
        punto
    }

    // Añadir localmente el punto
    points.push(punto);

    enviarPuntoAlServidor(data);

    // LIMPIAR CAMPOS
    // document.getElementById('distance').value = '';
    // document.getElementById('angle').value = '';
}

function enviarPuntoAlServidor(data){
    // Enviar al servidor
    socket.emit("nuevo_punto", data, (res) => {
        if (!res.ok) {
          console.error(res.error);
        } else {
          console.log("Punto guardado en servidor:", res.punto);
        }
      });
}

// Cambiar escala base dinámicamente
document.getElementById('scaleBase').addEventListener('input', e => {
    pixelsPerKm = parseInt(e.target.value);
});

// Cambiar alcance del radar
document.getElementById('rangeKm').addEventListener('input', e => {
    radarRangeKm = parseInt(e.target.value);
});

document.querySelectorAll('.colorBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedColor = btn.dataset.color;
        // visualmente marcar el botón activo
        document.querySelectorAll('.colorBtn').forEach(b => b.style.outline = '');
        btn.style.outline = '2px solid white';
        // opcional: sincronizar el input color con el botón clicado
        document.getElementById('pointColor').value = selectedColor;
    });
});

canvas.addEventListener('click', e => {
    const invX = (e.clientX - offsetX) / scale;
    const invY = (e.clientY - offsetY) / scale;

    const clickedPoint = points.find(p => {
        const pos = polarToCartesian(p.rKm * pixelsPerKm, p.angle);
        const dx = invX - pos.x;
        const dy = invY - pos.y;
        return dx*dx + dy*dy <= p.radius_circulo*p.radius_circulo;
    });

    if (clickedPoint) {
        document.getElementById('modalContent').innerHTML = `
            <b>Rumbo TO:</b> ${complementaryHeading(clickedPoint.angle).toFixed(1)}°<br>
            <b>Rumbo FROM:</b> ${clickedPoint.angle.toFixed(1)}°<br>
            <b>Distancia:</b> ${clickedPoint.rKm.toFixed(1)} km<br>
            <br><b>Nota:</b><br>
             <span id="modalNote" style="white-space: pre-wrap;"></span>
            <br><br><b>Informa:</b><br>
            <span id="modalInforma" style="white-space: pre-wrap;"></span>
        `;
        document.getElementById('modalNote').textContent = clickedPoint.note || '(sin nota)';
        document.getElementById('modalInforma').textContent = clickedPoint.user || '(desconocido)';

        modal.style.display = 'flex';
    }
});

// Para cerrar la modal cuando se hace clic fuera
const modal = document.getElementById('modal');
const modalContent = modal.querySelector('div');

// Cerrar si se hace clic en el overlay
modal.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Evitar que se cierre si clicas dentro de la caja de contenido
modalContent.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Zoom con rueda
canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomFactor = 1.05;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const prevScale = scale;

    if (e.deltaY < 0) {
        scale *= zoomFactor;
    } else {
        scale /= zoomFactor;
    }
    scale = Math.min(maxScale, Math.max(minScale, scale));

    // Mantener el mouse en el mismo lugar al hacer zoom
    offsetX = mouseX - (mouseX - offsetX) * (scale / prevScale);
    offsetY = mouseY - (mouseY - offsetY) * (scale / prevScale);
});

// Pan
let dragging = false, startX, startY;
canvas.addEventListener('mousedown', e => { dragging = true; startX = e.clientX - offsetX; startY = e.clientY - offsetY; });
canvas.addEventListener('mousemove', e => {
    if (dragging) {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
    }
    // Coordenadas del mouse en km
    const invX = (e.clientX - offsetX) / scale;
    const invY = (e.clientY - offsetY) / scale;
    const polar = cartesianToPolar(invX, invY);
    const polar_complementario = complementaryHeading(polar.theta);
    document.getElementById('mouseInfo').textContent = 
        `Mouse: r=${polar.r.toFixed(1)} km, θ=${polar.theta.toFixed(1)}°, β=${polar_complementario.toFixed(1)}`;
});
canvas.addEventListener('mouseup', () => dragging = false);
canvas.addEventListener('mouseleave', () => dragging = false);

// Redimensionar
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Iniciar animación
animate();

/* SINCRO CON EL SERVIDOR*/
const statusEl = document.getElementById("status");

// Conectar con el backend
function connectSocket(){
  if (socket && socket.connected) {
    console.log("⚠️ Ya hay una conexión activa");
    return;
  }
  console.log("🔌 Conectando al servidor...");
  socket = io(backend_uri, {
      reconnection: true,           // activa reconexión automática
      reconnectionAttempts: 10,     // máximo de reintentos
      reconnectionDelay: 1000,      // tiempo entre intentos
      timeout: 5000,                // tiempo máximo de espera
      autoConnect: true             // intenta conectar al crear el socket
  });

  // Cuando se conecta
  socket.on("connect", () => {
    console.log("✅ Conectado con ID:", socket.id);
    statusEl.style.backgroundColor = "green";
    sesionEnabled(true);
  });

  // Cuando se desconecta
  socket.on("disconnect", () => {
    console.log("Desconectado del servidor");
    statusEl.style.backgroundColor = "gray";
    sesionEnabled(false);
  });

  // Si hay error de conexión
  socket.on("connect_error", (err) => {
    console.warn("Error de conexión:", err.message);
    statusEl.style.backgroundColor = "red";
    sesionEnabled(false);
  });

  // Cuando recibe un punto
  socket.on("punto_actualizado", (data) => {
      console.log("Punto recibido:", data);
      const sesion = document.getElementById("sesion").value.trim();
      if (sesion == null){
          // Se establece el nuevo canal de comunicación
          document.getElementById("sesion").value = data.sesion;
      }
      else if(data.sesion == sesion){
          // Añado el nuevo punto al radar
          points.push(data.punto);
      } else {
          console.info("Se omite el punto: Es de otro canal");
      }
  });
}

/**
 * Desconecta manualmente del servidor.
 */
function disconnectSocket() {
  if (socket && socket.connected) {
    console.log("🛑 Desconectando...");
    socket.disconnect();
  } else {
    console.warn("⚠️ No hay conexión activa que cerrar.");
  }
}

/**
 * Reconecta manualmente (si no está conectado).
 */
function reconnectSocket() {
  console.log("🔄 Reconectando...");
  if (socket && socket.connected) {
    disconnectSocket(); 
  }
  connectSocket();
}

 // Seleccionar elementos
 const statusButton = document.getElementById('status');
 const modalOverlay = document.getElementById('modal-overlay');
 const backendurl = document.getElementById('backend-url');
 const connectModalButton = document.getElementById('connect-modal');
 const closeModalButton = document.getElementById('close-modal');

 // Mostrar la ventana modal
 statusButton.addEventListener('click', () => {
   backendurl.value = backend_uri;
   modalOverlay.style.display = 'flex';
 });

 connectModalButton.addEventListener('click', () => {
  backend_uri = backendurl.value;
  modalOverlay.style.display = 'none';
  reconnectSocket();
});

 // Cerrar la ventana modal
 closeModalButton.addEventListener('click', () => {
   modalOverlay.style.display = 'none';
 });

 // Cerrar la ventana modal al hacer clic fuera de ella
//  modalOverlay.addEventListener('click', (event) => {
//    if (event.target === modalOverlay) {
//      modalOverlay.style.display = 'none';
//    }
//  });