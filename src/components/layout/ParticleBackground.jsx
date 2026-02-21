import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h;
    const particles = [];
    let animId;

    function resize() {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * (w || 800),
        y: Math.random() * (h || 600),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.3 + 0.05,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,164,55,${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} id="particles" />;
}
