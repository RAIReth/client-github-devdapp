import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from '../src/client';
import { GitHubAutoLabeler, CommonLabelingRules } from '../src/github-auto-labeler';
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

describe('GitHubAutoLabeler', () => {
  let mockRuntime: AgentRuntime;
  let client: GitHubClient;
  let autoLabeler: GitHubAutoLabeler;
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
    autoLabeler = new GitHubAutoLabeler(client);
    octokitInstance = (Octokit as any).mock.results[0].value;
  });

  describe('constructor', () => {
    it('should create an instance with default config', () => {
      expect(autoLabeler).toBeInstanceOf(GitHubAutoLabeler);
    });

    it('should create an instance with custom config', () => {
      const customConfig = {
        createMissingLabels: true,
        defaultLabelColor: 'ff0000',
        relabelExistingIssues: false,
        issueState: 'all' as const
      };
      
      const customLabeler = new GitHubAutoLabeler(client, customConfig);
      expect(customLabeler).toBeInstanceOf(GitHubAutoLabeler);
    });
  });

  describe('addRule and addRules', () => {
    it('should add a single rule', () => {
      autoLabeler.addRule(CommonLabelingRules.bug);
      
      // Run with no rules should throw, so if it doesn't throw, rules were added
      expect(() => autoLabeler.run()).not.toThrow('No labeling rules defined');
    });

    it('should add multiple rules', () => {
      autoLabeler.addRules([
        CommonLabelingRules.bug,
        CommonLabelingRules.enhancement,
        CommonLabelingRules.documentation
      ]);
      
      // Run with no rules should throw, so if it doesn't throw, rules were added
      expect(() => autoLabeler.run()).not.toThrow('No labeling rules defined');
    });
  });

  describe('run', () => {
    it('should throw an error if no rules are defined', async () => {
      await expect(autoLabeler.run()).rejects.toThrow('No labeling rules defined');
    });

    it('should process issues and apply labels based on rules', async () => {
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

      // Add rules
      autoLabeler.addRules([
        CommonLabelingRules.bug,
        CommonLabelingRules.enhancement,
        CommonLabelingRules.documentation
      ]);

      // Run the auto-labeler
      const result = await autoLabeler.run();
      
      // Verify results
      expect(result.totalIssues).toBe(3);
      expect(result.labeledIssues).toBe(3);
      expect(result.labelsCreated).toBe(0);
      expect(result.details).toHaveLength(3);
      
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

    it('should create missing labels when configured to do so', async () => {
      // Mock issues in the repository
      const mockIssues = [
        { 
          number: 1, 
          title: 'Security vulnerability found', 
          body: 'There is a security issue in the authentication system.',
          labels: []
        }
      ];
      
      // Mock existing labels (security label doesn't exist)
      const mockLabels = [
        { name: 'bug', color: 'ff0000' },
        { name: 'enhancement', color: '00ff00' }
      ];
      
      // Setup mocks
      octokitInstance.issues.listForRepo.mockResolvedValueOnce({ data: mockIssues });
      octokitInstance.issues.listLabelsForRepo.mockResolvedValueOnce({ data: mockLabels });
      octokitInstance.issues.createLabel.mockResolvedValueOnce({ data: { name: 'security', color: '0075ca' } });
      octokitInstance.issues.addLabels.mockResolvedValue({ data: {} });

      // Configure auto-labeler to create missing labels
      autoLabeler.setConfig({ createMissingLabels: true });
      
      // Add security rule
      autoLabeler.addRule(CommonLabelingRules.security);

      // Run the auto-labeler
      const result = await autoLabeler.run();
      
      // Verify results
      expect(result.totalIssues).toBe(1);
      expect(result.labeledIssues).toBe(1);
      expect(result.labelsCreated).toBe(1);
      
      // Verify that the label was created
      expect(octokitInstance.issues.createLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        name: 'security',
        color: '0075ca',
        description: 'Auto-created label for security'
      });
      
      // Verify that the label was applied
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: 1,
        labels: ['security']
      });
    });

    it('should skip already labeled issues when configured to do so', async () => {
      // Mock issues in the repository (one already has labels)
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
          labels: [{ name: 'enhancement' }]
        }
      ];
      
      // Mock existing labels
      const mockLabels = [
        { name: 'bug', color: 'ff0000' },
        { name: 'enhancement', color: '00ff00' }
      ];
      
      // Setup mocks
      octokitInstance.issues.listForRepo.mockResolvedValueOnce({ data: mockIssues });
      octokitInstance.issues.listLabelsForRepo.mockResolvedValueOnce({ data: mockLabels });
      octokitInstance.issues.addLabels.mockResolvedValue({ data: {} });

      // Configure auto-labeler to skip already labeled issues
      autoLabeler.setConfig({ relabelExistingIssues: false });
      
      // Add rules
      autoLabeler.addRules([
        CommonLabelingRules.bug,
        CommonLabelingRules.enhancement
      ]);

      // Run the auto-labeler
      const result = await autoLabeler.run();
      
      // Verify results
      expect(result.totalIssues).toBe(2);
      expect(result.labeledIssues).toBe(1); // Only one issue should be labeled
      
      // Verify that only the unlabeled issue was processed
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledTimes(1);
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: 1,
        labels: ['bug']
      });
    });
  });
}); 