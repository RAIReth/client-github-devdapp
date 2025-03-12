import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from '../src/client';
import type { AgentRuntime } from '@elizaos/core';
import { Octokit } from '@octokit/rest';

// Mock external dependencies
vi.mock('@octokit/rest', () => {
  return {
    Octokit: vi.fn(() => ({
      issues: {
        get: vi.fn(),
        addLabels: vi.fn(),
        listForRepo: vi.fn(),
        listLabelsForRepo: vi.fn(),
        createLabel: vi.fn(),
      }
    }))
  };
});

describe('GitHub Auto Labeler', () => {
  let mockRuntime: AgentRuntime;
  let client: GitHubClient;
  let octokitInstance: any;
  
  const mockConfig = {
    GITHUB_OWNER: 'testowner',
    GITHUB_REPO: 'testrepo',
    GITHUB_BRANCH: 'main',
    GITHUB_PATH: 'src',
    GITHUB_API_TOKEN: 'ghp_test123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime = {
      getSetting: vi.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
    } as unknown as AgentRuntime;
    client = new GitHubClient(mockRuntime);
    octokitInstance = (Octokit as any).mock.results[0].value;
  });

  describe('autoLabelIssues', () => {
    it('should automatically label issues based on content', async () => {
      // Mock issues in the repository
      const mockIssues = [
        { 
          number: 1, 
          title: 'Bug: Application crashes on startup', 
          body: 'The application crashes when I try to start it.',
          labels: []
        },
        { 
          number: 2, 
          title: 'Feature request: Add dark mode', 
          body: 'Please add dark mode to the application.',
          labels: []
        },
        { 
          number: 3, 
          title: 'Documentation needs update', 
          body: 'The documentation is outdated.',
          labels: []
        }
      ];
      
      // Mock existing labels
      const mockLabels = [
        { name: 'bug', color: 'ff0000' },
        { name: 'enhancement', color: '00ff00' },
        { name: 'documentation', color: '0000ff' }
      ];
      
      // Setup mocks
      octokitInstance.issues.listForRepo.mockResolvedValueOnce({ data: mockIssues });
      octokitInstance.issues.listLabelsForRepo.mockResolvedValueOnce({ data: mockLabels });
      octokitInstance.issues.addLabels.mockResolvedValue({ data: {} });

      // Define auto-labeling rules
      const labelingRules = [
        { pattern: /bug|crash|error|fix/i, labels: ['bug'] },
        { pattern: /feature|enhancement|add|improve/i, labels: ['enhancement'] },
        { pattern: /doc|documentation/i, labels: ['documentation'] }
      ];

      // Implement auto-labeling function
      async function autoLabelIssues(client: GitHubClient, rules: Array<{ pattern: RegExp, labels: string[] }>) {
        // Get all issues
        const issues = await client.getRepoIssues();
        
        // Get all available labels
        const availableLabels = await client.getRepoLabels();
        const availableLabelNames = availableLabels.map(label => label.name);
        
        // Process each issue
        for (const issue of issues) {
          const issueText = `${issue.title} ${issue.body}`;
          const labelsToAdd: string[] = [];
          
          // Check each rule
          for (const rule of rules) {
            if (rule.pattern.test(issueText)) {
              // Only add labels that exist in the repository
              const validLabels = rule.labels.filter(label => availableLabelNames.includes(label));
              labelsToAdd.push(...validLabels);
            }
          }
          
          // Apply labels if any matched
          if (labelsToAdd.length > 0) {
            await client.labelIssue(issue.number, labelsToAdd);
          }
        }
        
        return issues.length;
      }

      // Test the auto-labeling function
      await autoLabelIssues(client, labelingRules);
      
      // Verify that the correct labels were applied
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledTimes(3);
      
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: 1,
        labels: ['bug']
      });
      
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: 2,
        labels: ['enhancement']
      });
      
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: 3,
        labels: ['documentation']
      });
    });
  });
}); 