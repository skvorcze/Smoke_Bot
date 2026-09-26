// Dev-only scene tuning panel — never linked from the nav. Reached via the
// 'S' hotkey (see main.js), which lazy-imports this module so its ~code is
// excluded from the bundle regular visitors download.
import {
  backgroundColor, groundColor, skyColors, buildSkyTexture,
} from '../scene/uniforms.js';
import { STAGE_NAMES, stageParamDefs, stageParamKeys, stageParams } from '../scene/stages.js';
import { cameraPath } from '../scene/cameraPath.js';
import { sceneState } from '../scene/index.js';

export function mountSettingsPanel({ scene, camera, setGlobalDofEnabled }) {
  const panel = document.getElementById('settingsPanel');
  const gear = document.getElementById('settingsGear');
  if (!panel || panel.dataset.mounted) return;
  panel.dataset.mounted = '1';

  let open = false;
  function setOpen(v) {
    open = v;
    panel.classList.toggle('open', open);
    gear?.classList.toggle('active', open);
  }

  gear?.addEventListener('click', () => setOpen(!open));
  window.addEventListener('keydown', (e) => {
    if ((e.key === 's' || e.key === 'S') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      setOpen(!open);
    }
  });

  let globalDofEnabled = true;
  let fpsEnabled = false;
  let editorMode = 'scroll';
  let activeStage = -1;
  let expandedStage = -1;

  const fpsOverlay = document.createElement('div');
  fpsOverlay.style.cssText = 'position:fixed;top:10px;left:10px;z-index:400;font:12px/1 monospace;color:rgba(180,210,140,0.6);background:rgba(0,0,0,0.4);padding:5px 10px;border-radius:6px;pointer-events:none;display:none;';
  document.body.appendChild(fpsOverlay);
  let fpsFrames = 0;
  let fpsLast = performance.now();
  function fpsTick() {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsLast >= 500) {
      if (fpsEnabled) fpsOverlay.textContent = `${(fpsFrames / ((now - fpsLast) / 1000)).toFixed(0)} FPS`;
      fpsFrames = 0;
      fpsLast = now;
    }
    requestAnimationFrame(fpsTick);
  }
  requestAnimationFrame(fpsTick);

  function build() {
    let html = '';

    html += section('Global Colors', [
      colorRow('Background', '#' + backgroundColor.value.getHexString(), 'bg'),
      colorRow('Ground', '#' + groundColor.value.getHexString(), 'ground'),
    ].join(''));

    html += section('Sky Gradient', [
      colorRow('Top (Zenith)', '#' + skyColors.top.getHexString(), 'sky_top'),
      colorRow('Mid High', '#' + skyColors.midHigh.getHexString(), 'sky_midHigh'),
      colorRow('Mid Low', '#' + skyColors.midLow.getHexString(), 'sky_midLow'),
      colorRow('Horizon', '#' + skyColors.horizon.getHexString(), 'sky_horizon'),
    ].join(''));

    let camHtml = `<div style="display:flex;gap:6px;margin-bottom:12px;">
      <button id="modeScrollBtn" class="sp-mode-btn">⏵ Scroll</button>
      <button id="modeEditBtn" class="sp-mode-btn">✎ Edit</button>
    </div>
    <div id="modeHint" class="sp-hint">Scroll mode — camera follows scroll position.</div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button id="copyPathBtn" class="sp-copy-btn">Copy JSON</button>
    </div>`;

    cameraPath.forEach((kf, i) => {
      camHtml += `<div class="cp-stage" id="cp_stage_${i}">
        <div class="cp-header" data-stage="${i}">
          <span class="sp-label">${STAGE_NAMES[i]}</span>
          <span class="cp-arrow" id="cp_${i}_arrow">▸</span>
        </div>
        <div class="cp-controls" id="cp_${i}_controls" style="display:none;">
          ${camField('Pos X', i, 'px', kf[1], -10, 10)}
          ${camField('Pos Y', i, 'py', kf[2], 0.1, 15)}
          ${camField('Pos Z', i, 'pz', kf[3], 0, 25)}
          ${camField('Look X', i, 'lx', kf[4], -5, 5)}
          ${camField('Look Y', i, 'ly', kf[5], -2, 3)}
          ${camField('Look Z', i, 'lz', kf[6], -10, 10)}
          <div class="sp-divider"></div>
          ${stageParamGroups(i)}
        </div>
      </div>`;
    });
    html += section('Camera Path', camHtml);

    html += section('Rendering', toggleRow('Depth of Field', 'globalDofToggle', true));
    html += section('Debug', toggleRow('FPS Counter', 'fpsToggle', false));

    panel.innerHTML = html;
    wire();
  }

  function section(title, inner) {
    return `<div class="sp-section"><div class="sp-section-title">${title}</div>${inner}</div>`;
  }
  function colorRow(label, hex, id) {
    return `<div class="sp-color-row"><span class="sp-label">${label}</span><input type="color" class="sp-color-input" id="sp_${id}" value="${hex}"></div>`;
  }
  function toggleRow(label, id, active) {
    return `<div class="sp-toggle-row"><span class="sp-label">${label}</span><div class="sp-toggle ${active ? 'active' : ''}" id="${id}"></div></div>`;
  }
  function camField(label, i, key, val, min, max) {
    return `<div class="sp-row"><span class="sp-label">${label}</span><span class="sp-val" id="cp_${i}_${key}_v">${val.toFixed(1)}</span></div>
      <input type="range" class="sp-slider" id="cp_${i}_${key}" min="${min}" max="${max}" step="0.1" value="${val}">`;
  }
  function stageParamGroups(i) {
    const sp = stageParams[i];
    const groups = {};
    stageParamKeys.forEach((k) => {
      const d = stageParamDefs[k];
      (groups[d.group] ||= []).push({ key: k, ...d, val: sp[k] });
    });
    let out = '';
    Object.keys(groups).forEach((grp) => {
      out += `<div class="sp-group-title">${grp}</div>`;
      const colorGroups = {};
      groups[grp].forEach((c) => { if (c.isColor) (colorGroups[c.isColor] ||= []).push(c); });
      Object.keys(colorGroups).forEach((colorName) => {
        const channels = colorGroups[colorName];
        const r = channels.find((c) => c.ch === 'r');
        const g = channels.find((c) => c.ch === 'g');
        const b = channels.find((c) => c.ch === 'b');
        if (r && g && b) {
          const hex = '#' + [r, g, b].map((c) => Math.round(c.val * 255).toString(16).padStart(2, '0')).join('');
          out += colorRow(colorName.replace('Color', ''), hex, `stage_${i}_cpick_${colorName}`);
        }
      });
      groups[grp].forEach((c) => {
        out += `<div class="sp-row"><span class="sp-label">${c.label}</span><span class="sp-val" id="sp_stage_${i}_${c.key}_v">${c.val.toFixed(2)}</span></div>
          <input type="range" class="sp-slider" id="sp_stage_${i}_${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.val}">`;
      });
    });
    return out;
  }

  function selectStage(i) {
    if (activeStage >= 0 && activeStage !== i) {
      document.getElementById(`cp_stage_${activeStage}`)?.style.setProperty('border-color', 'rgba(140,180,120,0.08)');
    }
    document.getElementById(`cp_stage_${i}`)?.style.setProperty('border-color', 'rgba(180,210,140,0.35)');
    activeStage = i;
    sceneState.cameraOverrideStage = i;
    document.getElementById('modeHint').textContent = `Editing: ${STAGE_NAMES[i]} — click again to expand controls.`;
    document.querySelector(`.section[data-stage="${i}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (camera) {
      const kf = cameraPath[i];
      camera.position.set(kf[1], kf[2], kf[3]);
    }
  }

  function setMode(mode) {
    editorMode = mode;
    const scrollBtn = document.getElementById('modeScrollBtn');
    const editBtn = document.getElementById('modeEditBtn');
    const hint = document.getElementById('modeHint');
    if (mode === 'scroll') {
      scrollBtn.classList.add('is-active');
      editBtn.classList.remove('is-active');
      hint.textContent = 'Scroll mode — camera follows scroll position.';
      activeStage = -1;
      sceneState.cameraOverrideStage = -1;
    } else {
      editBtn.classList.add('is-active');
      scrollBtn.classList.remove('is-active');
      hint.textContent = 'Edit mode — click a stage to preview & tweak it.';
      selectStage(activeStage >= 0 ? activeStage : 0);
    }
  }

  function wire() {
    document.getElementById('sp_bg')?.addEventListener('input', (e) => backgroundColor.value.set(e.target.value));
    document.getElementById('sp_ground')?.addEventListener('input', (e) => groundColor.value.set(e.target.value));

    ['top', 'midHigh', 'midLow', 'horizon'].forEach((key) => {
      document.getElementById(`sp_sky_${key}`)?.addEventListener('input', (e) => {
        skyColors[key].set(e.target.value);
        if (scene) scene.background = buildSkyTexture();
      });
    });

    document.getElementById('modeScrollBtn').addEventListener('click', () => setMode('scroll'));
    document.getElementById('modeEditBtn').addEventListener('click', () => setMode('edit'));
    setMode('scroll');

    document.getElementById('copyPathBtn').addEventListener('click', () => {
      const json = JSON.stringify(cameraPath.map((kf, i) => ({
        stage: STAGE_NAMES[i], scroll: kf[0], params: stageParams[i],
      })), null, 2);
      navigator.clipboard?.writeText(json).catch(() => {});
      const btn = document.getElementById('copyPathBtn');
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 1200);
    });

    cameraPath.forEach((kf, i) => {
      const header = document.querySelector(`#cp_stage_${i} .cp-header`);
      header.addEventListener('click', () => {
        if (editorMode !== 'edit') return;
        const controls = document.getElementById(`cp_${i}_controls`);
        const arrow = document.getElementById(`cp_${i}_arrow`);
        if (activeStage === i) {
          const isExpanded = expandedStage === i;
          controls.style.display = isExpanded ? 'none' : 'block';
          arrow.textContent = isExpanded ? '▸' : '▾';
          expandedStage = isExpanded ? -1 : i;
          return;
        }
        selectStage(i);
      });

      [['px', 1], ['py', 2], ['pz', 3], ['lx', 4], ['ly', 5], ['lz', 6]].forEach(([key, idx]) => {
        const slider = document.getElementById(`cp_${i}_${key}`);
        const val = document.getElementById(`cp_${i}_${key}_v`);
        slider?.addEventListener('input', () => {
          kf[idx] = parseFloat(slider.value);
          val.textContent = kf[idx].toFixed(1);
        });
      });

      stageParamKeys.forEach((k) => {
        const slider = document.getElementById(`sp_stage_${i}_${k}`);
        const val = document.getElementById(`sp_stage_${i}_${k}_v`);
        slider?.addEventListener('input', () => {
          const v = parseFloat(slider.value);
          stageParams[i][k] = v;
          val.textContent = v.toFixed(2);
          const d = stageParamDefs[k];
          if (d.isColor) syncColorPicker(i, d.isColor);
        });
      });

      const colorNames = new Set(stageParamKeys.map((k) => stageParamDefs[k].isColor).filter(Boolean));
      colorNames.forEach((colorName) => {
        const cpEl = document.getElementById(`sp_stage_${i}_cpick_${colorName}`);
        cpEl?.addEventListener('input', () => {
          const hex = cpEl.value;
          const r = parseInt(hex.substr(1, 2), 16) / 255;
          const g = parseInt(hex.substr(3, 2), 16) / 255;
          const b = parseInt(hex.substr(5, 2), 16) / 255;
          stageParamKeys.forEach((k) => {
            const d = stageParamDefs[k];
            if (d.isColor === colorName) {
              if (d.ch === 'r') stageParams[i][k] = r;
              if (d.ch === 'g') stageParams[i][k] = g;
              if (d.ch === 'b') stageParams[i][k] = b;
              const sl = document.getElementById(`sp_stage_${i}_${k}`);
              const vl = document.getElementById(`sp_stage_${i}_${k}_v`);
              if (sl) sl.value = stageParams[i][k];
              if (vl) vl.textContent = stageParams[i][k].toFixed(2);
            }
          });
        });
      });
    });

    function syncColorPicker(stageIdx, colorName) {
      const cpEl = document.getElementById(`sp_stage_${stageIdx}_cpick_${colorName}`);
      if (!cpEl) return;
      let r = 0, g = 0, b = 0;
      stageParamKeys.forEach((k) => {
        const d = stageParamDefs[k];
        if (d.isColor === colorName) {
          if (d.ch === 'r') r = stageParams[stageIdx][k];
          if (d.ch === 'g') g = stageParams[stageIdx][k];
          if (d.ch === 'b') b = stageParams[stageIdx][k];
        }
      });
      cpEl.value = '#' + [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
    }

    document.getElementById('globalDofToggle').addEventListener('click', (e) => {
      globalDofEnabled = !globalDofEnabled;
      e.target.classList.toggle('active', globalDofEnabled);
      setGlobalDofEnabled?.(globalDofEnabled);
    });

    document.getElementById('fpsToggle').addEventListener('click', (e) => {
      fpsEnabled = !fpsEnabled;
      e.target.classList.toggle('active', fpsEnabled);
      fpsOverlay.style.display = fpsEnabled ? 'block' : 'none';
    });
  }

  build();
  setOpen(true);
}
