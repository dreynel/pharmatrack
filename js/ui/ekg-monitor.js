/**
 * PharmaTrack - Real-Time Medical EKG Telemetry Waveform Monitor
 * Canvas-based 60 FPS Bio-Cardiogram & System Health Waveform
 * 100% Native Vanilla JS & HTML5 Canvas
 */

(function (window, document) {
  'use strict';

  class EKGMonitor {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width = 160;
      this.height = this.canvas.height = 36;
      this.points = [];
      this.maxPoints = this.width;
      this.x = 0;
      this.step = 0;
      this.beatCycle = 90; // Frames per beat cycle (~65-75 BPM)
      this.color = '#00f2fe';
      this.glowColor = '#00a896';
      this.isRunning = false;

      this.init();
    }

    init() {
      // Pre-fill points with baseline
      const mid = this.height / 2;
      for (let i = 0; i < this.maxPoints; i++) {
        this.points.push(mid);
      }

      this.start();

      // Handle visibility changes to save CPU
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.start();
        }
      });
    }

    getWaveformValue(t) {
      const mid = this.height / 2;
      const cycle = t % this.beatCycle;

      // P-Q-R-S-T medical cardiac waveform simulation
      if (cycle >= 15 && cycle < 25) {
        // P-wave (soft bump)
        const progress = (cycle - 15) / 10;
        return mid - Math.sin(progress * Math.PI) * 4;
      } else if (cycle >= 28 && cycle < 31) {
        // Q-dip (slight downward)
        return mid + 3;
      } else if (cycle >= 31 && cycle < 35) {
        // R-spike (huge high-voltage electrical spike)
        const progress = (cycle - 31) / 4;
        return mid - 14 + Math.sin(progress * Math.PI) * -3;
      } else if (cycle >= 35 && cycle < 39) {
        // S-dip (sharp downward overshoot)
        const progress = (cycle - 35) / 4;
        return mid + 7;
      } else if (cycle >= 45 && cycle < 60) {
        // T-wave (ventricular repolarization)
        const progress = (cycle - 45) / 15;
        return mid - Math.sin(progress * Math.PI) * 5;
      }

      // Baseline electrical noise
      return mid + (Math.random() - 0.5) * 1.2;
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;

      const render = () => {
        if (!this.isRunning) return;

        // Advance simulation
        this.step++;
        const nextY = this.getWaveformValue(this.step);
        this.points.push(nextY);
        if (this.points.length > this.maxPoints) {
          this.points.shift();
        }

        // Draw Canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Grid lines (subtle medical CRT oscilloscope grid)
        this.ctx.strokeStyle = 'rgba(0, 168, 150, 0.08)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let x = 0; x < this.width; x += 16) {
          this.ctx.moveTo(x, 0);
          this.ctx.lineTo(x, this.height);
        }
        for (let y = 0; y < this.height; y += 12) {
          this.ctx.moveTo(0, y);
          this.ctx.lineTo(this.width, y);
        }
        this.ctx.stroke();

        // Waveform Line with Glowing Shadow
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = this.color;
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 1.8;
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
          const x = i;
          const y = this.points[i];
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.stroke();

        // Sweeping Leading Head Dot
        const headX = this.points.length - 1;
        const headY = this.points[headX];
        this.ctx.beginPath();
        this.ctx.arc(headX, headY, 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00f2fe';
        this.ctx.fill();

        this.animationId = requestAnimationFrame(render);
      };

      this.animationId = requestAnimationFrame(render);
    }

    stop() {
      this.isRunning = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  window.EKGMonitor = EKGMonitor;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      new EKGMonitor('ekg-canvas');
    }, 200);
  });

})(window, document);

