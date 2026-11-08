using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/version")]
public class VersionController(IConfiguration configuration) : ControllerBase
{
    private static readonly DateTimeOffset StartedAt = Process.GetCurrentProcess().StartTime.ToUniversalTime();

    // The Docker image copies the repo-root VERSION file next to the app (see docker/backend.Dockerfile).
    private static readonly string VersionFile = Path.Combine(AppContext.BaseDirectory, "VERSION");

    /// <summary>Gets the release version (VERSION file, or "dev"), the deployed commit SHA (RENDER_GIT_COMMIT, or "dev") and the process start time.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(VersionResponse), StatusCodes.Status200OK)]
    public IActionResult Get() =>
        Ok(new VersionResponse(
            System.IO.File.Exists(VersionFile) ? System.IO.File.ReadAllText(VersionFile).Trim() : "dev",
            configuration["RENDER_GIT_COMMIT"] is { Length: > 0 } sha ? sha : "dev",
            StartedAt));

    public record VersionResponse(string Version, string Commit, DateTimeOffset DeployedAt);
}
