import axios from 'axios';

const GH_INDEXER_API = 'http://localhost:5005/api';
const PORTFOLIO_API = 'http://localhost:5006/api';

class PortfolioClient {
  // GitHub Indexer methods
  async syncFromGitHub() {
    const response = await axios.post(`${GH_INDEXER_API}/sync`);
    return response.data;
  }

  // Portfolio API methods
  async getModules() {
    const response = await axios.get(`${PORTFOLIO_API}/modules`);
    return response.data.modules || [];
  }

  async getModule(slug) {
    const response = await axios.get(`${PORTFOLIO_API}/modules/${slug}`);
    return response.data.module;
  }

  async getArtifacts(moduleSlug) {
    const response = await axios.get(`${PORTFOLIO_API}/modules/${moduleSlug}/artifacts`);
    return response.data.artifacts || [];
  }

  async getOutcomes(moduleSlug) {
    const response = await axios.get(`${PORTFOLIO_API}/modules/${moduleSlug}/outcomes`);
    return response.data.outcomes || [];
  }

  async getRubric(moduleSlug) {
    const response = await axios.get(`${PORTFOLIO_API}/modules/${moduleSlug}/rubric`);
    return response.data.rubric || [];
  }

  async getReflections(moduleSlug) {
    const response = await axios.get(`${PORTFOLIO_API}/modules/${moduleSlug}/reflections`);
    return response.data.reflections || [];
  }

  async addReflection(moduleSlug, reflection) {
    const response = await axios.post(`${PORTFOLIO_API}/modules/${moduleSlug}/reflections`, reflection);
    return response.data;
  }

  async getFeedback(moduleSlug) {
    const response = await axios.get(`${PORTFOLIO_API}/modules/${moduleSlug}/feedback`);
    return response.data.feedback || [];
  }

  async addFeedback(moduleSlug, feedback) {
    const response = await axios.post(`${PORTFOLIO_API}/modules/${moduleSlug}/feedback`, feedback);
    return response.data;
  }

  async exportJSON() {
    const response = await axios.post(`${PORTFOLIO_API}/export/json`);
    return response.data.data;
  }
}

export default new PortfolioClient();
