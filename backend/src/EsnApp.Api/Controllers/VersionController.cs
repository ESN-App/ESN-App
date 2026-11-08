using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/version")]
public class VersionController(IConfiguration configuration) : ControllerBase
{
    private static readonly DateTimeOffset StartedAt = Process.GetCurrentProcess().StartTime.ToUniversalTime();

    /// <summary>Gets the deployed commit SHA (RENDER_GIT_COMMIT, or "dev") and the process start time.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(VersionResponse), StatusCodes.Status200OK)]
    public IActionResult Get() =>
        Ok(new VersionResponse(configuration["RENDER_GIT_COMMIT"] is { Length: > 0 } sha ? sha : "dev", StartedAt));

    public record VersionResponse(string Commit, DateTimeOffset DeployedAt);
}
