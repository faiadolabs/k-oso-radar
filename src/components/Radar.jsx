import { useRef, useEffect } from "react"

export default function Radar({ points = [], rangeKm = 100, pixelsPerKm = 20 }){
    const canvasRef = useRef(null)
    let radarAngle = 0

    function polarToCartesian(r, angleDegrees, width, height) {
        const angle = angleDegrees * Math.PI / 180
        const cx = width / 2
        const cy = height / 2
        return {
          x: cx + r * Math.sin(angle),
          y: cy - r * Math.cos(angle)
        }
    }

    function drawRadar(ctx, width, height) {
        const cx = width / 2
        const cy = height / 2
        const maxRadiusPx = rangeKm * pixelsPerKm
    
        ctx.clearRect(0, 0, width, height)
    
        // Fondo
        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, width, height)
    
        // Círculos de distancia
        ctx.strokeStyle = "rgba(0,255,0,0.3)"
        for (let rKm = 5; rKm <= rangeKm; rKm += 5) {
          ctx.beginPath()
          ctx.arc(cx, cy, rKm * pixelsPerKm, 0, Math.PI * 2)
          ctx.stroke()
        }
    
        // Punto central
        ctx.fillStyle = "white"
        ctx.beginPath()
        ctx.arc(cx, cy, 4, 0, Math.PI * 2)
        ctx.fill()
    
        // Puntos
        points.forEach(p => {
          if (p.rKm <= rangeKm) {
            const pos = polarToCartesian(p.rKm * pixelsPerKm, p.angle, width, height)
            ctx.fillStyle = p.color || "#777"
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2)
            ctx.fill()
          }
        })
    
        // Haz del radar
        const start = (radarAngle - 1) * Math.PI / 180
        const end = (radarAngle + 1) * Math.PI / 180
    
        ctx.fillStyle = "rgba(0,255,0,0.2)"
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, maxRadiusPx, start, end)
        ctx.closePath()
        ctx.fill()
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
    
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    
        function animate() {
          radarAngle = (radarAngle + 1) % 360
          drawRadar(ctx, canvas.width, canvas.height)
          requestAnimationFrame(animate)
        }
    
        animate()
      }, [points, rangeKm, pixelsPerKm])

    return <canvas ref={canvasRef} />
}