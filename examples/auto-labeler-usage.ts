import { GitHubClient, GitHubAutoLabeler, CommonLabelingRules } from '../src';
import type { AgentRuntime } from '@elizaos/core';

/**
 * Example of how to use the GitHub Auto Labeler
 * 
 * This example demonstrates how to:
 * 1. Initialize the GitHub client
 * 2. Create an auto-labeler instance
 * 3. Configure the auto-labeler
 * 4. Add labeling rules
 * 5. Run the auto-labeling process
 */
async function runAutoLabeler(runtime: AgentRuntime) {
  try {
    // Initialize the GitHub client
    const client = new GitHubClient(runtime);
    await client.initialize();
    
    // Create an auto-labeler instance with custom configuration
    const autoLabeler = new GitHubAutoLabeler(client, {
      createMissingLabels: true,      // Create labels that don't exist
      defaultLabelColor: '0075ca',    // Default color for created labels
      relabelExistingIssues: true,    // Process issues that already have labels
      issueState: 'open'              // Only process open issues
    });
    
    // Add common labeling rules
    autoLabeler.addRules([
      CommonLabelingRules.bug,
      CommonLabelingRules.enhancement,
      CommonLabelingRules.documentation,
      CommonLabelingRules.question,
      CommonLabelingRules.security,
      CommonLabelingRules.performance
    ]);
    
    // Add a custom rule
    autoLabeler.addRule({
      pattern: /\b(ui|ux|interface|design|layout|css|style)\b/i,
      labels: ['ui/ux'],
      description: 'Issues related to user interface or user experience'
    });
    
    // Run the auto-labeler
    console.log('Running auto-labeler...');
    const result = await autoLabeler.run();
    
    // Log the results
    console.log(`Auto-labeling complete!`);
    console.log(`Total issues processed: ${result.totalIssues}`);
    console.log(`Issues labeled: ${result.labeledIssues}`);
    console.log(`Labels created: ${result.labelsCreated}`);
    
    // Log details of labeled issues
    console.log('\nLabeled issues:');
    result.details.forEach(detail => {
      console.log(`- #${detail.issueNumber}: ${detail.title}`);
      console.log(`  Labels: ${detail.appliedLabels.join(', ')}`);
    });
    
    return result;
  } catch (error) {
    console.error('Error running auto-labeler:', error.message);
    throw error;
  }
}

// Example of how to use the auto-labeler with a specific set of rules
async function runCustomAutoLabeler(runtime: AgentRuntime) {
  const client = new GitHubClient(runtime);
  await client.initialize();
  
  // Create an auto-labeler with default configuration
  const autoLabeler = new GitHubAutoLabeler(client);
  
  // Define custom rules for a specific project
  const projectRules = [
    {
      pattern: /\b(api|endpoint|rest|graphql|http)\b/i,
      labels: ['api'],
      description: 'Issues related to API endpoints'
    },
    {
      pattern: /\b(database|db|sql|query|schema|model)\b/i,
      labels: ['database'],
      description: 'Issues related to database operations'
    },
    {
      pattern: /\b(auth|login|logout|register|password|user)\b/i,
      labels: ['auth'],
      description: 'Issues related to authentication and user management'
    },
    {
      pattern: /\b(test|testing|unit test|integration test|e2e|coverage)\b/i,
      labels: ['testing'],
      description: 'Issues related to testing'
    }
  ];
  
  // Add the custom rules
  autoLabeler.addRules(projectRules);
  
  // Run the auto-labeler
  return await autoLabeler.run();
}

export { runAutoLabeler, runCustomAutoLabeler }; 