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
        removeLabel: vi.fn(),
        removeAllLabels: vi.fn(),
        setLabels: vi.fn(),
        listLabelsForRepo: vi.fn(),
        createLabel: vi.fn(),
      }
    }))
  };
});

describe('GitHub Issue Labeling', () => {
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

  describe('labelIssue', () => {
    it('should add labels to an issue', async () => {
      const mockIssueNumber = 123;
      const mockLabels = ['bug', 'enhancement'];
      const mockResponse = { data: { number: mockIssueNumber, labels: mockLabels } };
      
      octokitInstance.issues.get.mockResolvedValueOnce({});
      octokitInstance.issues.addLabels.mockResolvedValueOnce(mockResponse);

      const result = await client.labelIssue(mockIssueNumber, mockLabels);
      
      expect(octokitInstance.issues.get).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: mockIssueNumber
      });
      
      expect(octokitInstance.issues.addLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: mockIssueNumber,
        labels: mockLabels
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if issue number is invalid', async () => {
      await expect(client.labelIssue(0, ['bug'])).rejects.toThrow('Invalid parameters');
    });

    it('should throw an error if labels is not an array', async () => {
      await expect(client.labelIssue(123, null as any)).rejects.toThrow('Invalid parameters');
    });
  });

  describe('removeIssueLabel', () => {
    it('should remove a specific label from an issue', async () => {
      const mockIssueNumber = 123;
      const mockLabel = 'bug';
      const mockResponse = { data: { number: mockIssueNumber } };
      
      octokitInstance.issues.removeLabel.mockResolvedValueOnce(mockResponse);

      const result = await client.removeIssueLabel(mockIssueNumber, mockLabel);
      
      expect(octokitInstance.issues.removeLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: mockIssueNumber,
        name: mockLabel
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should remove all labels from an issue when no label is specified', async () => {
      const mockIssueNumber = 123;
      const mockResponse = { data: { number: mockIssueNumber } };
      
      octokitInstance.issues.removeAllLabels.mockResolvedValueOnce(mockResponse);

      const result = await client.removeIssueLabel(mockIssueNumber);
      
      expect(octokitInstance.issues.removeAllLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: mockIssueNumber
      });
      
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('setIssueLabels', () => {
    it('should set labels for an issue', async () => {
      const mockIssueNumber = 123;
      const mockLabels = ['bug', 'enhancement'];
      const mockResponse = { data: { number: mockIssueNumber, labels: mockLabels } };
      
      octokitInstance.issues.setLabels.mockResolvedValueOnce(mockResponse);

      const result = await client.setIssueLabels(mockIssueNumber, mockLabels);
      
      expect(octokitInstance.issues.setLabels).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        issue_number: mockIssueNumber,
        labels: mockLabels
      });
      
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getRepoLabels', () => {
    it('should get all labels for a repository', async () => {
      const mockLabels = [{ name: 'bug', color: 'ff0000' }, { name: 'enhancement', color: '00ff00' }];
      const mockResponse = { data: mockLabels };
      
      octokitInstance.issues.listLabelsForRepo.mockResolvedValueOnce(mockResponse);

      const result = await client.getRepoLabels();
      
      expect(octokitInstance.issues.listLabelsForRepo).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO
      });
      
      expect(result).toEqual(mockLabels);
    });
  });

  describe('createLabel', () => {
    it('should create a new label in the repository', async () => {
      const mockName = 'bug';
      const mockColor = 'ff0000';
      const mockDescription = 'Bug label';
      const mockResponse = { data: { name: mockName, color: mockColor, description: mockDescription } };
      
      octokitInstance.issues.createLabel.mockResolvedValueOnce(mockResponse);

      const result = await client.createLabel(mockName, mockColor, mockDescription);
      
      expect(octokitInstance.issues.createLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        name: mockName,
        color: mockColor,
        description: mockDescription
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should remove # from color if present', async () => {
      const mockName = 'bug';
      const mockColor = '#ff0000';
      const mockResponse = { data: { name: mockName, color: 'ff0000' } };
      
      octokitInstance.issues.createLabel.mockResolvedValueOnce(mockResponse);

      await client.createLabel(mockName, mockColor);
      
      expect(octokitInstance.issues.createLabel).toHaveBeenCalledWith({
        owner: mockConfig.GITHUB_OWNER,
        repo: mockConfig.GITHUB_REPO,
        name: mockName,
        color: 'ff0000',
        description: ''
      });
    });
  });
}); 