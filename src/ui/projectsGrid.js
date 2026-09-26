import { projects } from '../content/projects.js';
import { copy } from '../content/copy.js';
import { getCurrentLang, onLanguageChange } from '../content/i18n.js';

function renderCard(project, lang) {
  const dict = copy[lang] || copy.en;
  const title = project.title[lang] || project.title.en;
  const description = project.description[lang] || project.description.en;
  const tags = project.tags.map((t) => `<span class="project-tag">${t}</span>`).join('');
  const badge = project.placeholder
    ? `<span class="project-badge">${dict.projects.comingSoon}</span>`
    : '';
  const linkAttrs = project.link ? `href="${project.link}" target="_blank" rel="noopener"` : 'href="javascript:void(0)" tabindex="-1" aria-disabled="true"';

  return `
    <article class="pillar-card project-card" data-reveal>
      <div class="project-card-image" style="background-image:url('${project.image}')"></div>
      <div class="project-card-body">
        ${badge}
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="project-tags">${tags}</div>
        <a class="project-link" ${linkAttrs}>${dict.projects.viewProject} →</a>
      </div>
    </article>
  `;
}

export function initProjectsGrid(onNewCards) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  function render(lang) {
    grid.innerHTML = projects.map((p) => renderCard(p, lang)).join('');
    if (typeof onNewCards === 'function') onNewCards(grid);
  }

  render(getCurrentLang());
  onLanguageChange(render);
}
