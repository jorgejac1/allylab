import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  setGitHubToken,
  getGitHubToken,
  removeGitHubToken,
  getConnection,
  getRepos,
  getRepoBranches,
  getFileContent,
  createPullRequest,
  getPRStatus,
} from "../services/github.js";
import type {
  CreatePRRequest,
  VerifyFixRequest,
  VerificationResult,
} from "../types/github.js";

// For now, use a simple user ID (in production, this would come from auth)
const DEFAULT_USER_ID = "default-user";

// GitHub user response type
interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export async function githubRoutes(fastify: FastifyInstance) {
  // Connect GitHub (store token)
  fastify.post<{ Body: { token: string } }>(
    "/github/connect",
    async (
      request: FastifyRequest<{ Body: { token: string } }>,
      reply: FastifyReply
    ) => {
      const { token } = request.body;

      if (!token) {
        return reply.status(400).send({ error: "Token is required" });
      }

      // Validate token by trying to fetch user
      try {
        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!response.ok) {
          console.error(
            "[GitHub Routes] Invalid token, status:",
            response.status
          );
          return reply.status(401).send({ error: "Invalid GitHub token" });
        }

        const user = (await response.json()) as GitHubUser;
        setGitHubToken(DEFAULT_USER_ID, token);

        return reply.send({
          success: true,
          user: {
            login: user.login,
            avatar_url: user.avatar_url,
            name: user.name,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[GitHub Routes] Failed to validate token:", message);
        return reply.status(500).send({ error: "Failed to validate token" });
      }
    }
  );

  // Disconnect GitHub
  fastify.post(
    "/github/disconnect",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      removeGitHubToken(DEFAULT_USER_ID);
      return reply.send({ success: true });
    }
  );

  // Get connection status
  fastify.get(
    "/github/status",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const connection = await getConnection(DEFAULT_USER_ID);
        return reply.send(connection);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          "[GitHub Routes] Failed to get connection status:",
          message
        );
        return reply
          .status(500)
          .send({ error: "Failed to check connection status" });
      }
    }
  );

  // List repositories
  fastify.get(
    "/github/repos",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const token = getGitHubToken(DEFAULT_USER_ID);

      if (!token) {
        return reply.status(401).send({ error: "GitHub not connected" });
      }

      try {
        const repos = await getRepos(token);
        return reply.send(repos);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[GitHub Routes] Failed to fetch repos:", message);
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Get branches for a repo
  fastify.get<{ Params: { owner: string; repo: string } }>(
    "/github/repos/:owner/:repo/branches",
    async (
      request: FastifyRequest<{ Params: { owner: string; repo: string } }>,
      reply: FastifyReply
    ) => {
      const token = getGitHubToken(DEFAULT_USER_ID);

      if (!token) {
        return reply.status(401).send({ error: "GitHub not connected" });
      }

      try {
        const { owner, repo } = request.params;
        const branches = await getRepoBranches(token, owner, repo);
        return reply.send(branches);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[GitHub Routes] Failed to fetch branches:", message);
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Get file content
  fastify.get<{
    Params: { owner: string; repo: string };
    Querystring: { path: string; branch?: string };
  }>(
    "/github/repos/:owner/:repo/file",
    async (
      request: FastifyRequest<{
        Params: { owner: string; repo: string };
        Querystring: { path: string; branch?: string };
      }>,
      reply: FastifyReply
    ) => {
      const token = getGitHubToken(DEFAULT_USER_ID);

      if (!token) {
        return reply.status(401).send({ error: "GitHub not connected" });
      }

      try {
        const { owner, repo } = request.params;
        const { path, branch } = request.query;

        if (!path) {
          return reply.status(400).send({ error: "Path is required" });
        }

        const file = await getFileContent(token, owner, repo, path, branch);

        if (!file) {
          return reply.status(404).send({ error: "File not found" });
        }

        return reply.send(file);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[GitHub Routes] Failed to fetch file:", message);
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Create Pull Request with fixes
  fastify.post<{ Body: CreatePRRequest }>(
    "/github/pr",
    async (
      request: FastifyRequest<{ Body: CreatePRRequest }>,
      reply: FastifyReply
    ) => {
      const token = getGitHubToken(DEFAULT_USER_ID);

      if (!token) {
        return reply.status(401).send({ error: "GitHub not connected" });
      }

      const { owner, repo, baseBranch, fixes, title, description } =
        request.body;

      if (!owner || !repo || !baseBranch || !fixes || fixes.length === 0) {
        return reply.status(400).send({
          error: "Missing required fields: owner, repo, baseBranch, fixes",
        });
      }

      try {
        const result = await createPullRequest(token, {
          owner,
          repo,
          baseBranch,
          fixes,
          title,
          description,
        });

        if (result.success) {
          return reply.send(result);
        } else {
          console.error("[GitHub Routes] PR creation failed:", result.error);
          return reply.status(500).send(result);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[GitHub Routes] Failed to create PR:", message);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // Get PR status
  fastify.get<{ Params: { owner: string; repo: string; prNumber: string } }>(
    "/github/repos/:owner/:repo/pulls/:prNumber",
    async (
      request: FastifyRequest<{
        Params: { owner: string; repo: string; prNumber: string };
      }>,
      reply: FastifyReply
    ) => {
      const token = getGitHubToken(DEFAULT_USER_ID);

      if (!token) {
        return reply.status(401).send({ error: "GitHub not connected" });
      }

      try {
        const { owner, repo, prNumber } = request.params;
        const status = await getPRStatus(
          token,
          owner,
          repo,
          parseInt(prNumber, 10)
        );

        if (!status) {
          return reply.status(404).send({ error: "PR not found" });
        }

        return reply.send(status);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[GitHub Routes] Failed to get PR status:", message);
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Verify fix by re-scanning
  // Verify fix by re-scanning
  fastify.post<{ Body: VerifyFixRequest }>(
    "/github/verify",
    async (
      request: FastifyRequest<{ Body: VerifyFixRequest }>,
      reply: FastifyReply
    ) => {
      const token = getGitHubToken(DEFAULT_USER_ID);

      if (!token) {
        return reply.status(401).send({ error: "GitHub not connected" });
      }

      const { url, findingIds, prNumber, owner, repo, standard, viewport } = request.body;

      if (!url || !findingIds || findingIds.length === 0) {
        return reply
          .status(400)
          .send({ error: "Missing required fields: url, findingIds" });
      }

      try {
        // 1. Check PR is merged
        const prStatus = await getPRStatus(token, owner, repo, prNumber);

        if (!prStatus) {
          return reply.status(404).send({ error: "PR not found" });
        }

        if (!prStatus.merged) {
          return reply.status(400).send({
            error: "PR is not merged yet. Merge the PR before verifying fixes.",
          });
        }

        // 2. Re-scan the page with same settings as original scan
        const { runScan } = await import("../services/scanner.js");
        const scanResult = await runScan({
          url,
          standard: standard || "wcag21aa",
          viewport: viewport || "desktop",
        });

        // 3. Check which findings are still present
        const currentFindings = scanResult.findings || [];
        const currentRuleIds = new Set(currentFindings.map((f) => f.ruleId));

        // We need to match by fingerprint ideally, but for now match by ruleId
        // In production use the fingerprint for more accurate matching
        const findingsVerified = findingIds.map((findingId) => {
          // Extract ruleId from findingId (format: "ruleId-index" or just check if rule exists)
          const ruleId =
            findingId.split("-").slice(0, -1).join("-") || findingId;
          const stillPresent = currentRuleIds.has(ruleId);

          return {
            findingId,
            ruleId,
            stillPresent,
          };
        });

        const allFixed = findingsVerified.every((f) => !f.stillPresent);

        const result: VerificationResult = {
          success: true,
          prNumber,
          findingsVerified,
          allFixed,
          scanScore: scanResult.score,
          scanTimestamp: new Date().toISOString(),
        };

        console.log(
          `[GitHub Routes] Verification complete: ${
            allFixed ? "All fixed" : "Some still present"
          }`
        );
        return reply.send(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[GitHub Routes] Verification failed:", message);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );
}
