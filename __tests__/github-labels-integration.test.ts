import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubClient } from '../src/client';
import type { AgentRuntime } from '@elizaos/core';

// This is an integration test file that demonstrates how to use the GitHub labeling functionality
// Note: These tests are skipped by default as they require actual GitHub credentials
// To run these tests, you need to:
// 1. Set up the environment variables (GITHUB_OWNER, GITHUB_REPO, GITHUB_API_TOKEN, etc.)
// 2. Remove the .skip from the describe block

describe.skip('GitHub Label Management Integration Tests', () => {
  let client: GitHubClient;
  let runtime: AgentRuntime;
  
  // Test label data
  const testLabelName = 'test-label-' + Date.now();
  const testLabelColor = 'a2eeef';
  const testLabelDescription = 'Test label created by integration tests';
  
  // Test issue number - replace with an actual issue number in your repository
  const testIssueNumber = 1;

  beforeEach(async () => {
    // Create a real runtime with actual environment variables
    runtime = {
      getSetting: (key: string) => process.env[key] || '',
      // Add other required properties as needed
    } as unknown as AgentRuntime;
    
    // Create and initialize the client
    client = new GitHubClient(runtime);
    await client.initialize();
  });

  afterEach(async () => {
    // Clean up: try to remove the test label if it exists
    try {
      // Get all labels
      const labels = await client.getRepoLabels();
      const testLabelExists = labels.some(label => label.name === testLabelName);
      
      if (testLabelExists) {
        // Remove the test label from the issue if it was applied
        await client.removeIssueLabel(testIssueNumber, testLabelName);
        
        // Note: GitHub API doesn't provide a direct way to delete labels from a repository
        // You would need to use the REST API directly for that
        console.log(`Test label "${testLabelName}" may need manual cleanup from the repository`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  it('should create a new label and apply it to an issue', async () => {
    // 1. Create a new label
    const createdLabel = await client.createLabel(
      testLabelName,
      testLabelColor,
      testLabelDescription
    );
    
    expect(createdLabel).toBeDefined();
    expect(createdLabel.name).toBe(testLabelName);
    expect(createdLabel.color).toBe(testLabelColor);
    expect(createdLabel.description).toBe(testLabelDescription);
    
    // 2. Get all repository labels and verify our label exists
    const allLabels = await client.getRepoLabels();
    const foundLabel = allLabels.find(label => label.name === testLabelName);
    
    expect(foundLabel).toBeDefined();
    expect(foundLabel?.color).toBe(testLabelColor);
    
    // 3. Apply the label to an issue
    const labeledIssue = await client.labelIssue(testIssueNumber, [testLabelName]);
    
    expect(labeledIssue).toBeDefined();
    expect(labeledIssue.labels.some((label: any) => label.name === testLabelName)).toBe(true);
    
    // 4. Remove the label from the issue
    const updatedIssue = await client.removeIssueLabel(testIssueNumber, testLabelName);
    
    expect(updatedIssue).toBeDefined();
    expect(updatedIssue.labels?.some((label: any) => label.name === testLabelName)).toBe(false);
  });

  it('should set multiple labels on an issue', async () => {
    // Create another test label
    const secondLabelName = testLabelName + '-2';
    await client.createLabel(secondLabelName, 'ff0000', 'Second test label');
    
    // Set both test labels on the issue
    const updatedIssue = await client.setIssueLabels(testIssueNumber, [testLabelName, secondLabelName]);
    
    expect(updatedIssue).toBeDefined();
    expect(updatedIssue.labels.some((label: any) => label.name === testLabelName)).toBe(true);
    expect(updatedIssue.labels.some((label: any) => label.name === secondLabelName)).toBe(true);
    
    // Clean up: remove all labels
    await client.removeIssueLabel(testIssueNumber);
  });

  it('should handle errors gracefully', async () => {
    // Try to get a non-existent issue
    const nonExistentIssueNumber = 999999;
    
    await expect(client.labelIssue(nonExistentIssueNumber, [testLabelName]))
      .rejects.toThrow();
  });
}); 