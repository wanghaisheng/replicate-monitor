import { parseSitemap } from '../utils/sitemapParser';
import { processModelUrl, ModelData } from '../utils/modelProcessor';
import * as fs from 'fs/promises';

async function analyzeReplicate() {
  const sitemapUrl = 'https://replicate.com/sitemap-models.xml';
  const entries = await parseSitemap(sitemapUrl);
  
  console.log(`Found ${entries.length} model URLs`);
  
  const modelData: ModelData[] = [];
  for (const entry of entries) {
    const data = await processModelUrl(entry.loc);
    if (data) {
      modelData.push(data);
      console.log(`Processed: ${data.name} (${data.callCount} calls)`);
    }
  }
  
  // Sort models by call count in descending order
  modelData.sort((a, b) => b.callCount - a.callCount);
  
  // Generate report
  const report = generateReport(modelData);
  
  // Save report
  const date = new Date().toISOString().split('T')[0];
  await fs.writeFile(`report-${date}.md`, report);
  
  console.log(`Report saved as report-${date}.md`);
}

function generateReport(modelData: ModelData[]): string {
  const totalModels = modelData.length;
  const totalCalls = modelData.reduce((sum, model) => sum + model.callCount, 0);
  
  let report = `# Replicate Model Analysis Report\n\n`;
  report += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
  report += `Total Models: ${totalModels}\n`;
  report += `Total Calls: ${totalCalls}\n\n`;
  
  report += `## Top 10 Models by Call Count\n\n`;
  report += `| Rank | Model | Calls | URL |\n`;
  report += `|------|-------|-------|-----|\n`;
  
  modelData.slice(0, 10).forEach((model, index) => {
    report += `| ${index + 1} | ${model.name} | ${model.callCount} | ${model.url} |\n`;
  });
  
  return report;
}

export { analyzeReplicate };
