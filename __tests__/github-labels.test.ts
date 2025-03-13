import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from '../src/client';
import type { AgentRuntime } from '@elizaos/core';
import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import type fs from 'fs';
import type fsPromises from 'fs/promises';

// Mock external dependencies
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => ({
    issues: {
      get: vi.fn(),
      addLabels: vi.fn(),
      removeLabel: vi.fn(),
      removeAllLabels: vi.fn(),
      setLabels: vi.fn(),
      listLabelsForRepo: vi.fn(),
      createLabel: vi.fn(),
    },
  })),
}));

vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    clone: vi.fn(),
    pull: vi.fn(),
    checkout: vi.fn(),
  })),
}));

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal() as typeof fsPromises;
  return {
    ...actual,
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
});

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal() as typeof fs;
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

vi.mock('@elizaos/core', () => ({
  elizaLogger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GitHub Label Management', () => {
  let client: GitHubClient;
  let mockRuntime: AgentRuntime;
  let mockOctokit: any;
  
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
    mockOctokit = (Octokit as unknown as vi.Mock).mock.results[0].value;
  });

  describe('labelIssue', () => {
    it('should add labels to an issue', async () => {
      // Setup
      const issueNumber = 123;
      const labels = ['bug', 'enhancement'];
      const mockResponse = { data: { number: issueNumber, labels } };
      
      mockOctokit.issues.get.mockResolvedValueOnce({});
      mockOctokit.issues.addLabels.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.labelIssue(issueNumber, labels);

      // Verify
      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: issueNumber,
      });
      
      expect(mockOctokit.issues.addLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: issueNumber,
        labels,
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if issue number is invalid', async () => {
      await expect(client.labelIssue(0, ['bug'])).rejects.toThrow('Invalid parameters');
    });

    it('should throw an error if labels is not an array', async () => {
      await expect(client.labelIssue(123, 'bug' as any)).rejects.toThrow('Invalid parameters');
    });

    it('should throw an error if issue does not exist', async () => {
      mockOctokit.issues.get.mockRejectedValueOnce(new Error('Issue not found'));
      await expect(client.labelIssue(999, ['bug'])).rejects.toThrow('Issue not found');
    });
  });

  describe('removeIssueLabel', () => {
    it('should remove a specific label from an issue', async () => {
      // Setup
      const issueNumber = 123;
      const label = 'bug';
      const mockResponse = { data: { number: issueNumber } };
      
      mockOctokit.issues.removeLabel.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.removeIssueLabel(issueNumber, label);

      // Verify
      expect(mockOctokit.issues.removeLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: issueNumber,
        name: label,
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should remove all labels from an issue when no label is specified', async () => {
      // Setup
      const issueNumber = 123;
      const mockResponse = { data: { number: issueNumber } };
      
      mockOctokit.issues.removeAllLabels.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.removeIssueLabel(issueNumber);

      // Verify
      expect(mockOctokit.issues.removeAllLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: issueNumber,
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if issue number is invalid', async () => {
      await expect(client.removeIssueLabel(0)).rejects.toThrow('Invalid parameter');
    });
  });

  describe('setIssueLabels', () => {
    it('should set labels for an issue', async () => {
      // Setup
      const issueNumber = 123;
      const labels = ['documentation', 'enhancement'];
      const mockResponse = { data: { number: issueNumber, labels } };
      
      mockOctokit.issues.setLabels.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.setIssueLabels(issueNumber, labels);

      // Verify
      expect(mockOctokit.issues.setLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: issueNumber,
        labels,
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if issue number is invalid', async () => {
      await expect(client.setIssueLabels(0, ['bug'])).rejects.toThrow('Invalid parameters');
    });

    it('should throw an error if labels is not an array', async () => {
      await expect(client.setIssueLabels(123, 'bug' as any)).rejects.toThrow('Invalid parameters');
    });
  });

  describe('getRepoLabels', () => {
    it('should get all labels for a repository', async () => {
      // Setup
      const mockLabels = [
        { name: 'bug', color: 'ff0000', description: 'Bug report' },
        { name: 'enhancement', color: '0000ff', description: 'Feature request' }
      ];
      const mockResponse = { data: mockLabels };
      
      mockOctokit.issues.listLabelsForRepo.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.getRepoLabels();

      // Verify
      expect(mockOctokit.issues.listLabelsForRepo).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
      });
      
      expect(result).toEqual(mockLabels);
    });
  });

  describe('createLabel', () => {
    it('should create a new label in the repository', async () => {
      // Setup
      const name = 'feature';
      const color = 'a2eeef';
      const description = 'New feature request';
      const mockLabel = { name, color, description };
      const mockResponse = { data: mockLabel };
      
      mockOctokit.issues.createLabel.mockResolvedValueOnce(mockResponse);

      // Execute
      const result = await client.createLabel(name, color, description);

      // Verify
      expect(mockOctokit.issues.createLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        name,
        color,
        description,
      });
      
      expect(result).toEqual(mockLabel);
    });

    it('should remove # from color if present', async () => {
      // Setup
      const name = 'feature';
      const color = '#a2eeef';
      const description = 'New feature request';
      const mockResponse = { data: { name, color: 'a2eeef', description } };
      
      mockOctokit.issues.createLabel.mockResolvedValueOnce(mockResponse);

      // Execute
      await client.createLabel(name, color, description);

      // Verify
      expect(mockOctokit.issues.createLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        name,
        color: 'a2eeef',
        description,
      });
    });

    it('should use empty string for description if not provided', async () => {
      // Setup
      const name = 'feature';
      const color = 'a2eeef';
      const mockResponse = { data: { name, color, description: '' } };
      
      mockOctokit.issues.createLabel.mockResolvedValueOnce(mockResponse);

      // Execute
      await client.createLabel(name, color);

      // Verify
      expect(mockOctokit.issues.createLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        name,
        color,
        description: '',
      });
    });

    it('should throw an error if name is not provided', async () => {
      await expect(client.createLabel('', 'a2eeef')).rejects.toThrow('Invalid parameters');
    });

    it('should throw an error if color is not provided', async () => {
      await expect(client.createLabel('feature', '')).rejects.toThrow('Invalid parameters');
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Setup
      const apiError = new Error('API rate limit exceeded');
      mockOctokit.issues.get.mockRejectedValueOnce(apiError);

      // Execute & Verify
      await expect(client.labelIssue(123, ['bug'])).rejects.toThrow('API rate limit exceeded');
    });
  });
}); 