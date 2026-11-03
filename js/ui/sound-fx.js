/**
 * PharmaTrack - Web Audio Cyber-Tactile Sound Synthesizer
 * Zero-Asset Audio Engine (Pure Synthesized Sine/Frequency Waves via Web Audio API)
 * 100% Native Vanilla JS - No MP3s or network downloads needed
 */

(function (window, document) {
  'use strict';

  let audioCtx = null;
  let isSoundEnabled = localStorage.getItem('pharmatrack_sound_enabled') === 'true';

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const SoundFX = {
    isEnabled: () => isSoundEnabled,

    toggle: (forceState) => {
      isSoundEnabled = (forceState !== undefined) ? forceState : !isSoundEnabled;
      localStorage.setItem('pharmatrack_sound_enabled', isSoundEnabled);
      SoundFX.updateUI();
      if (isSoundEnabled) {
        SoundFX.playClick();
      }
      return isSoundEnabled;
    },

    updateUI: () => {
      const soundBtn = document.getElementById('header-sound-toggle');
      if (!soundBtn) return;
      const icon = soundBtn.querySelector('i');
      if (isSoundEnabled) {
        soundBtn.classList.add('active');
        soundBtn.title = 'Sound Feedback: ON (Click to Mute)';
        if (icon) icon.className = 'ri-volume-up-fill text-primary';
      } else {
        soundBtn.classList.remove('active');
        soundBtn.title = 'Sound Feedback: MUTED (Click to Enable)';
        if (icon) icon.className = 'ri-volume-mute-line text-muted';
      }
    },

    // Soft Apple/Tesla-like tactile UI tick
    playClick: () => {
      if (!isSoundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.035);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.035);
      } catch (e) {
        // Ignore audio failures if browser blocks autoplay
      }
    },

    // High-tech laser sweep when scanning or checking out
    playScan: () => {
      if (!isSoundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2600, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch (e) {}
    },

    // Harmonious success chime (Major chord)
    playSuccess: () => {
      if (!isSoundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);

          gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + idx * 0.04);
          osc.stop(ctx.currentTime + idx * 0.04 + 0.22);
        });
      } catch (e) {}
    }
  };

  window.SoundFX = SoundFX;

  // Auto-bind sound feedback to buttons and clickable actions
  document.addEventListener('DOMContentLoaded', () => {
    SoundFX.updateUI();

    const soundBtn = document.getElementById('header-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.preventDefault();
        SoundFX.toggle();
      });
    }

    // Attach subtle feedback on interactive buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .nav-item button, .btn-action-icon, .btn-3d-action, .cat-btn, .product-card');
      if (btn && btn.id !== 'header-sound-toggle') {
        SoundFX.playClick();
      }
    });
  });

})(window, document);

