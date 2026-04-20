const center = 150;
        const radius = 130;
        const ticks = document.getElementById("ticks");
        const numbers = document.getElementById("numbers");
        for (let i = 0; i < 60; i++) {
            const a = i * 6 * Math.PI / 180;
            const isHour = i % 5 === 0;
            const len = isHour ? 15 : 7;
            const x1 = center + Math.sin(a) * (radius - len);
            const y1 = center - Math.cos(a) * (radius - len);
            const x2 = center + Math.sin(a) * radius;
            const y2 = center - Math.cos(a) * radius;
            const line = document.createElementNS("http://www.w3.org/2000/svg","line");
            line.setAttribute("x1",x1);
            line.setAttribute("y1",y1);
            line.setAttribute("x2",x2);
            line.setAttribute("y2",y2);
            line.setAttribute("stroke","white");
            line.setAttribute("stroke-width",isHour?3:1);
            ticks.appendChild(line);
        }
        for (let i = 1; i <= 12; i++) {
            const a = i * 30 * Math.PI / 180;
            const x = center + Math.sin(a) * 105;
            const y = center - Math.cos(a) * 105;
            const t = document.createElementNS("http://www.w3.org/2000/svg","text");
            t.setAttribute("x",x);
            t.setAttribute("y",y);
            t.textContent = i;
            numbers.appendChild(t);
        }
        const hourHand = document.getElementById("hourHand");
        const minuteHand = document.getElementById("minuteHand");
        const secondHand = document.getElementById("secondHand");
        function updateClock() {
            const now = new Date();
            const s = now.getSeconds();
            const m = now.getMinutes();
            const h = now.getHours() % 12;
            secondHand.setAttribute("transform",`rotate(${s*6} 150 150)`);
            minuteHand.setAttribute("transform",`rotate(${m*6 + s*0.1} 150 150)`);
            hourHand.setAttribute("transform",`rotate(${h*30 + m*0.5} 150 150)`);
        }
        function startClock() {
            updateClock();
            const now = Date.now();
            const delay = 1000 - (now % 1000);
            setTimeout(() => {
                updateClock();
                setInterval(updateClock, 1000);
            }, delay);
        }
        startClock();