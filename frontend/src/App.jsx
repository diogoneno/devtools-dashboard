import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './components/Home';

// Developer Tools
import JSONFormatter from './components/DeveloperTools/JSONFormatter';
import Base64Tool from './components/DeveloperTools/Base64Tool';
import RegexTester from './components/DeveloperTools/RegexTester';
import ColorPicker from './components/DeveloperTools/ColorPicker';
import JWTDecoder from './components/DeveloperTools/JWTDecoder';
import MarkdownPreview from './components/DeveloperTools/MarkdownPreview';
import CodeDiff from './components/DeveloperTools/CodeDiff';
import HashGenerator from './components/DeveloperTools/HashGenerator';
import QRCodeGen from './components/DeveloperTools/QRCodeGen';

// Productivity Tools
import UnitConverter from './components/ProductivityTools/UnitConverter';
import Calculator from './components/ProductivityTools/Calculator';
import TimerStopwatch from './components/ProductivityTools/TimerStopwatch';
import NoteTaker from './components/ProductivityTools/NoteTaker';
import PasswordGenerator from './components/ProductivityTools/PasswordGenerator';
import URLShortener from './components/ProductivityTools/URLShortener';
import LoremIpsum from './components/ProductivityTools/LoremIpsum';

// Data Tools
import JSONToCSV from './components/DataTools/JSONToCSV';
import ChartBuilder from './components/DataTools/ChartBuilder';
import IPLookup from './components/DataTools/IPLookup';
import UUIDGenerator from './components/DataTools/UUIDGenerator';
import TimestampConverter from './components/DataTools/TimestampConverter';

// Creative Tools
import ImagePlaceholder from './components/CreativeTools/ImagePlaceholder';
import ASCIIArt from './components/CreativeTools/ASCIIArt';
import RandomUser from './components/CreativeTools/RandomUser';

// API Tools
import Weather from './components/APITools/Weather';
import CurrencyConverter from './components/APITools/CurrencyConverter';
import GitHubStats from './components/APITools/GitHubStats';
import NewsFeed from './components/APITools/NewsFeed';

// Red Team / Security Tools
import DNSLookup from './components/RedTeamTools/DNSLookup';
import HTTPHeadersAnalyzer from './components/RedTeamTools/HTTPHeadersAnalyzer';
import SubdomainFinder from './components/RedTeamTools/SubdomainFinder';
import WhoisLookup from './components/RedTeamTools/WhoisLookup';
import SecurityHeadersChecker from './components/RedTeamTools/SecurityHeadersChecker';
import SQLInjectionTester from './components/RedTeamTools/SQLInjectionTester';
import XSSTester from './components/RedTeamTools/XSSTester';
import PasswordStrengthChecker from './components/RedTeamTools/PasswordStrengthChecker';
import SSLTLSChecker from './components/RedTeamTools/SSLTLSChecker';

// AI Engineering Tools
import TokenCounter from './components/AITools/TokenCounter';
import PromptTemplateBuilder from './components/AITools/PromptTemplateBuilder';
import ModelCostCalculator from './components/AITools/ModelCostCalculator';
import JSONSchemaGenerator from './components/AITools/JSONSchemaGenerator';
import SystemPromptBuilder from './components/AITools/SystemPromptBuilder';
import FewShotManager from './components/AITools/FewShotManager';
import ModelParameterCalculator from './components/AITools/ModelParameterCalculator';

// Misinformation Lab Tools
import OpenNewsIngest from './components/MisinfoTools/OpenNewsIngest';
import ClaimFactExplorer from './components/MisinfoTools/ClaimFactExplorer';
import PropagationGraphs from './components/MisinfoTools/PropagationGraphs';
import StanceToxicity from './components/MisinfoTools/StanceToxicity';
import MediaForensics from './components/MisinfoTools/MediaForensics';
import SourcePolicies from './components/MisinfoTools/SourcePolicies';
import DatasetBuilder from './components/MisinfoTools/DatasetBuilder';

// E-Portfolio
import PortfolioHome from './apps/portfolio/PortfolioHome';
import ModulePage from './apps/portfolio/ModulePage';

// Cyber Resilience Tools
import BackupResilienceCenter from './components/ResilienceTools/BackupResilienceCenter';
import RansomwareEarlyWarning from './components/ResilienceTools/RansomwareEarlyWarning';
import ComplianceEvidencePacks from './components/ResilienceTools/ComplianceEvidencePacks';

// AI Safety Tools
import PromptSafetyMonitor from './components/AISafetyTools/PromptSafetyMonitor';
import LLMRedTeamHarness from './components/AISafetyTools/LLMRedTeamHarness';
import ModelRobustnessLab from './components/AISafetyTools/ModelRobustnessLab';
import AgentToolAccessGate from './components/AISafetyTools/AgentToolAccessGate';

import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Developer Tools */}
          <Route path="/json-formatter" element={<JSONFormatter />} />
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/regex-tester" element={<RegexTester />} />
          <Route path="/color-picker" element={<ColorPicker />} />
          <Route path="/jwt-decoder" element={<JWTDecoder />} />
          <Route path="/markdown-preview" element={<MarkdownPreview />} />
          <Route path="/code-diff" element={<CodeDiff />} />
          <Route path="/hash-generator" element={<HashGenerator />} />
          <Route path="/qr-code" element={<QRCodeGen />} />

          {/* Productivity Tools */}
          <Route path="/unit-converter" element={<UnitConverter />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/timer" element={<TimerStopwatch />} />
          <Route path="/notes" element={<NoteTaker />} />
          <Route path="/password-generator" element={<PasswordGenerator />} />
          <Route path="/url-shortener" element={<URLShortener />} />
          <Route path="/lorem-ipsum" element={<LoremIpsum />} />

          {/* Data Tools */}
          <Route path="/json-to-csv" element={<JSONToCSV />} />
          <Route path="/chart-builder" element={<ChartBuilder />} />
          <Route path="/ip-lookup" element={<IPLookup />} />
          <Route path="/uuid-generator" element={<UUIDGenerator />} />
          <Route path="/timestamp-converter" element={<TimestampConverter />} />

          {/* Creative Tools */}
          <Route path="/image-placeholder" element={<ImagePlaceholder />} />
          <Route path="/ascii-art" element={<ASCIIArt />} />
          <Route path="/random-user" element={<RandomUser />} />

          {/* API Tools */}
          <Route path="/weather" element={<Weather />} />
          <Route path="/currency-converter" element={<CurrencyConverter />} />
          <Route path="/github-stats" element={<GitHubStats />} />
          <Route path="/news" element={<NewsFeed />} />

          {/* Red Team / Security Tools */}
          <Route path="/dns-lookup" element={<DNSLookup />} />
          <Route path="/http-headers-analyzer" element={<HTTPHeadersAnalyzer />} />
          <Route path="/subdomain-finder" element={<SubdomainFinder />} />
          <Route path="/whois-lookup" element={<WhoisLookup />} />
          <Route path="/security-headers-checker" element={<SecurityHeadersChecker />} />
          <Route path="/sql-injection-tester" element={<SQLInjectionTester />} />
          <Route path="/xss-tester" element={<XSSTester />} />
          <Route path="/password-strength-checker" element={<PasswordStrengthChecker />} />
          <Route path="/ssl-tls-checker" element={<SSLTLSChecker />} />

          {/* AI Engineering Tools */}
          <Route path="/token-counter" element={<TokenCounter />} />
          <Route path="/prompt-template-builder" element={<PromptTemplateBuilder />} />
          <Route path="/model-cost-calculator" element={<ModelCostCalculator />} />
          <Route path="/json-schema-generator" element={<JSONSchemaGenerator />} />
          <Route path="/system-prompt-builder" element={<SystemPromptBuilder />} />
          <Route path="/few-shot-manager" element={<FewShotManager />} />
          <Route path="/model-parameter-calculator" element={<ModelParameterCalculator />} />

          {/* Misinformation Lab Tools */}
          <Route path="/misinfo/open-news-ingest" element={<OpenNewsIngest />} />
          <Route path="/misinfo/claim-fact-explorer" element={<ClaimFactExplorer />} />
          <Route path="/misinfo/propagation-graphs" element={<PropagationGraphs />} />
          <Route path="/misinfo/stance-toxicity" element={<StanceToxicity />} />
          <Route path="/misinfo/media-forensics" element={<MediaForensics />} />
          <Route path="/misinfo/source-policies" element={<SourcePolicies />} />
          <Route path="/misinfo/dataset-builder" element={<DatasetBuilder />} />

          {/* E-Portfolio */}
          <Route path="/portfolio" element={<PortfolioHome />} />
          <Route path="/portfolio/:moduleSlug" element={<ModulePage />} />

          {/* Cyber Resilience & Data Protection */}
          <Route path="/resilience/backup-center" element={<BackupResilienceCenter />} />
          <Route path="/resilience/ransomware-warning" element={<RansomwareEarlyWarning />} />
          <Route path="/resilience/compliance-packs" element={<ComplianceEvidencePacks />} />

          {/* AI Safety & LLM Security */}
          <Route path="/ai-safety/prompt-monitor" element={<PromptSafetyMonitor />} />
          <Route path="/ai-safety/redteam-harness" element={<LLMRedTeamHarness />} />
          <Route path="/ai-safety/robustness-lab" element={<ModelRobustnessLab />} />
          <Route path="/ai-safety/tool-access-gate" element={<AgentToolAccessGate />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
