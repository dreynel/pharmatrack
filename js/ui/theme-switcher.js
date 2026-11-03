/**
 * PharmaTrack - Cyber-Deck Theme Switcher Engine
 * Supports Seamless Toggling between Cyber-Deck 2030 (Dark Obsidian/Neon) and Clinical Executive (Pristine Light)
 * Aligned with Modern Web Guidance (FOUC prevention & localStorage sync)
 */

(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'pharmatrack_theme';
  // Default to cyber-theme for high-tech impression
  const DEFAULT_THEME = 'cyber';

  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  }

  function applyTheme(themeName) {
    const isCyber = themeName === 'cyber';
    
    if (isCyber) {
      document.body.classList.add('cyber-theme');
      document.documentElement.setAttribute('data-theme', 'cyber');
    } else {
      document.body.classList.remove('cyber-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    localStorage.setItem(STORAGE_KEY, themeName);
    updateToggleUI(themeName);

    if (window.Chart) {
      const textColor = isCyber ? '#f1f5f9' : '#0f172a';
      const tickColor = isCyber ? '#94a3b8' : '#64748b';
      Chart.defaults.color = tickColor;
    }

    window.dispatchEvent(new CustomEvent('pharmatrack:themechange', { detail: { theme: themeName, isCyber } }));
  }

  function updateToggleUI(themeName) {
    const btn = document.getElementById('header-theme-toggle');
    if (!btn) return;

    const isCyber = themeName === 'cyber';
    const icon = btn.querySelector('i');
    const label = btn.querySelector('.theme-label');

    if (isCyber) {
      if (icon) icon.className = 'ri-moon-clear-fill text-info';
      if (label) label.textContent = 'Cyber-Deck 2030';
      btn.title = 'Current Mode: Cyber-Deck 2030 (Click for Clinical Light)';
    } else {
      if (icon) icon.className = 'ri-sun-line text-warning';
      if (label) label.textContent = 'Clinical Light';
      btn.title = 'Current Mode: Clinical Light (Click for Cyber-Deck 2030)';
    }
  }

  function toggleTheme() {
    const current = getSavedTheme();
    const next = current === 'cyber' ? 'light' : 'cyber';
    applyTheme(next);
    if (window.SoundFX && typeof window.SoundFX.playClick === 'function') {
      window.SoundFX.playClick();
    }
  }

  // Pre-apply theme before render to eliminate FOUC
  const initialTheme = getSavedTheme();
  if (initialTheme === 'cyber') {
    document.documentElement.setAttribute('data-theme', 'cyber');
    if (document.body) {
      document.body.classList.add('cyber-theme');
    }
  }

  window.ThemeSwitcher = {
    apply: applyTheme,
    toggle: toggleTheme,
    getTheme: getSavedTheme
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getSavedTheme());

    const btn = document.getElementById('header-theme-toggle');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    }
  });

})(window, document);

