import { AgentRuntime } from "@elizaos/core";
import { GitHubClient } from "../src/client";

/**
 * Manual test script for GitHub labeling functionality
 * 
 * To run this script:
 * 1. Set the required environment variables:
 *    - GITHUB_OWNER: Owner of the GitHub repository
 *    - GITHUB_REPO: Repository name
 *    - GITHUB_API_TOKEN: GitHub API token
 * 2. Run the script with: npx ts-node scripts/test-github-labels.ts
 */
async function testGitHubLabels() {
  try {
    console.log("Starting GitHub labels test script...");
    
    // Initialize the GitHub client
    const runtime = new AgentRuntime();
    const githubClient = new GitHubClient(runtime);
    await githubClient.initialize();
    
    console.log("GitHub client initialized successfully");
    
    // Get all repository labels
    console.log("\n1. Fetching repository labels...");
    const labels = await githubClient.getRepoLabels();
    console.log(`Found ${labels.length} labels in the repository:`);
    labels.forEach(label => {
      console.log(`- ${label.name} (#${label.color}): ${label.description || 'No description'}`);
    });
    
    // Create a new label
    const testLabelName = `test-label-${Date.now()}`;
    console.log(`\n2. Creating a new label "${testLabelName}"...`);
    
    try {
      const newLabel = await githubClient.createLabel(
        testLabelName,
        "a2eeef",
        "Test label created by test script"
      );
      console.log(`Created label: ${newLabel.name} (#${newLabel.color}): ${newLabel.description}`);
    } catch (error) {
      console.error(`Error creating label: ${error.message}`);
      // Continue with the test even if label creation fails
    }
    
    // Prompt for issue number
    const issueNumber = process.env.TEST_ISSUE_NUMBER ? 
      parseInt(process.env.TEST_ISSUE_NUMBER) : 
      1; // Default to issue #1
    
    console.log(`\n3. Using issue #${issueNumber} for label operations`);
    
    // Label an issue
    console.log(`\n4. Labeling issue #${issueNumber} with "${testLabelName}"...`);
    try {
      await githubClient.labelIssue(issueNumber, [testLabelName]);
      console.log(`Issue #${issueNumber} labeled successfully`);
    } catch (error) {
      console.error(`Error labeling issue: ${error.message}`);
    }
    
    // Set labels for an issue
    console.log(`\n5. Setting labels for issue #${issueNumber}...`);
    try {
      const existingLabels = labels.slice(0, 2).map(label => label.name);
      existingLabels.push(testLabelName);
      
      console.log(`Setting labels: ${existingLabels.join(', ')}`);
      await githubClient.setIssueLabels(issueNumber, existingLabels);
      console.log(`Issue #${issueNumber} labels updated successfully`);
    } catch (error) {
      console.error(`Error setting labels: ${error.message}`);
    }
    
    // Remove a label from an issue
    console.log(`\n6. Removing "${testLabelName}" label from issue #${issueNumber}...`);
    try {
      await githubClient.removeIssueLabel(issueNumber, testLabelName);
      console.log(`Label removed from issue #${issueNumber} successfully`);
    } catch (error) {
      console.error(`Error removing label: ${error.message}`);
    }
    
    // Remove all labels from an issue
    console.log(`\n7. Removing all labels from issue #${issueNumber}...`);
    try {
      await githubClient.removeIssueLabel(issueNumber);
      console.log(`All labels removed from issue #${issueNumber} successfully`);
    } catch (error) {
      console.error(`Error removing all labels: ${error.message}`);
    }
    
    console.log("\nTest script completed successfully!");
    
  } catch (error) {
    console.error("Test script failed:", error);
  }
}

// Run the test script
testGitHubLabels().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
}); 