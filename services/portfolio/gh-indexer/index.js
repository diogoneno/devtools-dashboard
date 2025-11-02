import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { discoverModules } from './discover.js';
import { getDatabase } from '../portfolio-api/init-db.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.GH_INDEXER_PORT || 5005;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gh-indexer' });
});

// List all discovered modules
app.get('/api/modules', (req, res) => {
  try {
    const db = getDatabase();
    const modules = db.prepare('SELECT * FROM modules ORDER BY name').all();

    res.json({
      success: true,
      modules,
      count: modules.length
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync modules from GitHub
app.post('/api/sync', async (req, res) => {
  try {
    console.log('🔄 Starting GitHub sync...');

    const config = {
      mode: process.env.GITHUB_MODE || 'single-repo',
      owner: process.env.GITHUB_OWNER || 'example',
      repo: process.env.GITHUB_REPO || 'example-repo',
      modulePaths: (process.env.GITHUB_MODULE_PATHS || 'modules').split(','),
      token: process.env.GITHUB_TOKEN || '',
      publicOnly: process.env.PUBLIC_ONLY !== 'false'
    };

    const modules = await discoverModules(config);

    // Store in database
    const db = getDatabase();
    const insertModule = db.prepare(`
      INSERT OR REPLACE INTO modules (slug, name, repo, path, summary_md, outcomes_json, rubric_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertArtifact = db.prepare(`
      INSERT OR REPLACE INTO artifacts (module_slug, kind, title, rel_path, url, commit_sha, tags_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Clear old artifacts (will be re-inserted)
    db.prepare('DELETE FROM artifacts').run();

    for (const module of modules) {
      insertModule.run(
        module.slug,
        module.name,
        module.repo,
        module.path,
        module.readme || '',
        JSON.stringify(module.outcomes || []),
        JSON.stringify(module.rubric || []),
      );

      // Insert artifacts
      for (const artifact of module.artifacts || []) {
        insertArtifact.run(
          module.slug,
          artifact.kind,
          artifact.title,
          artifact.relPath,
          artifact.url || '',
          artifact.commit || '',
          JSON.stringify(artifact.tags || [])
        );
      }
    }

    // Also cache as JSON
    const cachePath = join(__dirname, '../../../data/portfolio/modules.json');
    writeFileSync(cachePath, JSON.stringify(modules, null, 2));

    console.log(`✅ Synced ${modules.length} modules`);

    res.json({
      success: true,
      modules: modules.length,
      message: `Discovered ${modules.length} modules from GitHub`
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ GitHub Indexer running on http://localhost:${PORT}`);
});
