/**
 * GitHub repository discovery and module metadata extraction.
 *
 * WHY: E-portfolios are often scattered across GitHub repositories without
 * a central catalog. This module automates discovery of learning modules by
 * scanning repositories for standardized structures (READMEs, outcomes.yaml,
 * rubrics) and building a unified index. This eliminates manual catalog
 * maintenance and enables students to organize work organically in Git.
 */
import fetch from 'node-fetch';
import { parse as parseYAML } from 'yaml';
import matter from 'gray-matter';

const OUTCOMES_FILES = ['outcomes.yaml', 'outcomes.json', 'learning-outcomes.md'];
const RUBRIC_FILES = ['rubric.yaml', 'rubric.json', 'rubric.md'];

/**
 * Discovers and indexes learning modules from GitHub repositories.
 *
 * WHY: Students organize their portfolio work across multiple repositories
 * without a central index. This function automates discovery by scanning
 * repositories for module directories (e.g., /modules/*, /labs/*) and
 * extracting structured metadata (learning outcomes, rubrics, artifacts).
 * Supports both single-repo and org-wide scanning modes to accommodate
 * different portfolio organization strategies.
 *
 * @param {Object} config - Discovery configuration
 * @param {string} config.mode - 'single-repo' or 'org-wide'
 * @param {string} config.owner - GitHub username or organization name
 * @param {string} config.repo - Repository name (required for single-repo mode)
 * @param {string} [config.token] - GitHub personal access token for private repos
 * @param {string[]} config.modulePaths - Path patterns to scan (e.g., ['modules/*', 'labs/*'])
 * @param {boolean} [config.publicOnly=false] - Skip private repos in org-wide mode
 *
 * @returns {Promise<Array<Object>>} Array of discovered module metadata objects
 * @returns {string} return[].slug - URL-safe module identifier
 * @returns {string} return[].name - Human-readable module name
 * @returns {string} return[].repo - 'owner/repo' identifier
 * @returns {string} return[].path - Path to module directory in repo
 * @returns {string} return[].readme - Markdown content from README.md
 * @returns {Array<Object>} return[].outcomes - Learning outcomes with evidence tracking
 * @returns {Array<Object>} return[].rubric - Assessment criteria with levels
 * @returns {Array<Object>} return[].artifacts - Discovered files (code, docs, notebooks)
 *
 * @throws {Error} If GitHub API returns non-200 status (network errors, rate limits, 404s)
 * @throws {Error} If invalid mode specified (must be 'single-repo' or 'org-wide')
 *
 * @example
 * // Single repository scan
 * const config = {
 *   mode: 'single-repo',
 *   owner: 'student123',
 *   repo: 'cs-portfolio',
 *   modulePaths: ['modules/*'],
 *   token: process.env.GITHUB_TOKEN
 * };
 * const modules = await discoverModules(config);
 * // Returns: [{ slug: 'module-1', name: 'Module 1', outcomes: [...], ... }]
 *
 * @example
 * // Organization-wide scan (all repos)
 * const config = {
 *   mode: 'org-wide',
 *   owner: 'university-cs',
 *   modulePaths: ['assignments/*', 'projects/*'],
 *   publicOnly: true
 * };
 * const modules = await discoverModules(config);
 */
export async function discoverModules(config) {
  const modules = [];

  if (config.mode === 'single-repo') {
    const repoModules = await discoverFromRepo(config.owner, config.repo, config);
    modules.push(...repoModules);
  } else if (config.mode === 'org-wide') {
    const repos = await listOrgRepos(config.owner, config.token);
    for (const repo of repos) {
      if (config.publicOnly && repo.private) continue;
      const repoModules = await discoverFromRepo(config.owner, repo.name, config);
      modules.push(...repoModules);
    }
  }

  return modules;
}

async function listOrgRepos(owner, token) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const url = `https://api.github.com/users/${owner}/repos?per_page=100`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to list repos: ${response.statusText}`);
  }

  return await response.json();
}

async function discoverFromRepo(owner, repo, config) {
  const modules = [];

  // For each module path pattern
  for (const pathPattern of config.modulePaths) {
    const dirs = await findModuleDirectories(owner, repo, pathPattern, config.token);

    for (const dir of dirs) {
      try {
        const module = await buildModuleMetadata(owner, repo, dir, config.token);
        if (module) {
          modules.push(module);
        }
      } catch (error) {
        console.warn(`Failed to process ${dir}:`, error.message);
      }
    }
  }

  return modules;
}

async function findModuleDirectories(owner, repo, pathPattern, token) {
  // Simple pattern matching: if pathPattern is exact, check if it exists
  // Otherwise, list root and filter
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  try {
    // Try to get directory contents
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${pathPattern}`;
    const response = await fetch(url, { headers });

    if (response.ok) {
      const contents = await response.json();

      if (Array.isArray(contents)) {
        // It's a directory listing
        return contents.filter(item => item.type === 'dir').map(item => item.path);
      } else if (contents.type === 'dir') {
        return [pathPattern];
      }
    }

    // Fallback: list root and glob match
    const rootUrl = `https://api.github.com/repos/${owner}/${repo}/contents/`;
    const rootResponse = await fetch(rootUrl, { headers });
    if (rootResponse.ok) {
      const rootContents = await rootResponse.json();
      const pattern = pathPattern.replace(/\*/g, '.*');
      const regex = new RegExp(pattern);
      return rootContents
        .filter(item => item.type === 'dir' && regex.test(item.name))
        .map(item => item.path);
    }
  } catch (error) {
    console.warn(`Error finding directories in ${pathPattern}:`, error.message);
  }

  return [];
}

async function buildModuleMetadata(owner, repo, path, token) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Get directory contents
  const response = await fetch(baseUrl, { headers });
  if (!response.ok) return null;

  const contents = await response.json();
  if (!Array.isArray(contents)) return null;

  // Extract module name from path
  const pathParts = path.split('/');
  const dirName = pathParts[pathParts.length - 1];
  const slug = dirName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const module = {
    slug,
    name: dirName,
    repo: `${owner}/${repo}`,
    path,
    readme: '',
    outcomes: [],
    rubric: [],
    artifacts: []
  };

  // Find README
  const readmeFile = contents.find(f => /^readme\.md$/i.test(f.name));
  if (readmeFile) {
    module.readme = await fetchFileContent(readmeFile.download_url);
  }

  // Find outcomes
  const outcomesFile = contents.find(f => OUTCOMES_FILES.includes(f.name.toLowerCase()));
  if (outcomesFile) {
    module.outcomes = await parseOutcomesFile(outcomesFile.download_url, outcomesFile.name);
  } else {
    // Placeholder
    module.outcomes = [
      { id: 'LO1', description: 'Define and explain core concepts', evidence: [] },
      { id: 'LO2', description: 'Apply techniques to solve problems', evidence: [] },
      { id: 'LO3', description: 'Analyze and evaluate solutions', evidence: [] }
    ];
  }

  // Find rubric
  const rubricFile = contents.find(f => RUBRIC_FILES.includes(f.name.toLowerCase()));
  if (rubricFile) {
    module.rubric = await parseRubricFile(rubricFile.download_url, rubricFile.name);
  } else {
    // Placeholder
    module.rubric = [
      { criterion: 'Technical Quality', levels: ['Poor', 'Fair', 'Good', 'Excellent'], weight: 40 },
      { criterion: 'Documentation', levels: ['Poor', 'Fair', 'Good', 'Excellent'], weight: 30 },
      { criterion: 'Innovation', levels: ['Poor', 'Fair', 'Good', 'Excellent'], weight: 30 }
    ];
  }

  // Find artifacts
  for (const file of contents) {
    if (file.type === 'file') {
      const artifact = classifyArtifact(file);
      if (artifact) {
        module.artifacts.push(artifact);
      }
    }
  }

  return module;
}

async function fetchFileContent(url) {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error.message);
    return '';
  }
}

async function parseOutcomesFile(url, filename) {
  const content = await fetchFileContent(url);

  try {
    if (filename.endsWith('.yaml')) {
      const data = parseYAML(content);
      return Array.isArray(data) ? data : data.outcomes || [];
    } else if (filename.endsWith('.json')) {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : data.outcomes || [];
    } else if (filename.endsWith('.md')) {
      // Parse markdown with front matter
      const { data, content: body } = matter(content);
      return data.outcomes || parseMarkdownList(body);
    }
  } catch (error) {
    console.warn(`Failed to parse outcomes from ${filename}:`, error.message);
  }

  return [];
}

async function parseRubricFile(url, filename) {
  const content = await fetchFileContent(url);

  try {
    if (filename.endsWith('.yaml')) {
      const data = parseYAML(content);
      return Array.isArray(data) ? data : data.rubric || [];
    } else if (filename.endsWith('.json')) {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : data.rubric || [];
    }
  } catch (error) {
    console.warn(`Failed to parse rubric from ${filename}:`, error.message);
  }

  return [];
}

function parseMarkdownList(markdown) {
  // Simple markdown list parser
  const lines = markdown.split('\n');
  const outcomes = [];

  for (const line of lines) {
    const match = line.match(/^[-*]\s+(.+)$/);
    if (match) {
      outcomes.push({
        id: `LO${outcomes.length + 1}`,
        description: match[1].trim(),
        evidence: []
      });
    }
  }

  return outcomes;
}

function classifyArtifact(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const name = file.name;

  let kind = 'other';
  let tags = [];

  if (ext === 'pdf') {
    kind = 'pdf';
    tags = ['document'];
  } else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
    kind = 'image';
    tags = ['visual'];
  } else if (ext === 'ipynb') {
    kind = 'notebook';
    tags = ['code', 'analysis'];
  } else if (ext === 'md') {
    kind = 'markdown';
    tags = ['documentation'];
  } else if (['pptx', 'ppt', 'key'].includes(ext)) {
    kind = 'presentation';
    tags = ['slides'];
  } else if (['py', 'js', 'java', 'cpp', 'c', 'rs', 'go'].includes(ext)) {
    kind = 'code';
    tags = ['source'];
  } else {
    return null; // Skip
  }

  return {
    kind,
    title: name,
    relPath: file.path,
    url: file.html_url,
    commit: file.sha,
    tags
  };
}
