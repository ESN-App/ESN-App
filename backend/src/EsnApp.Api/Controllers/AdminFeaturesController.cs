using EsnApp.Api.Contracts.Features;
using EsnApp.Application.Features;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/features")]
[Authorize(Roles = "Admin")]
public class AdminFeaturesController(ISender sender) : ControllerBase
{
    /// <summary>Lists all known feature flags for administration.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<FeatureFlagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminFeatureFlagsQuery(), cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>Switches a known feature flag on or off.</summary>
    [HttpPut("{key}")]
    [ProducesResponseType(typeof(FeatureFlagDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        string key,
        UpdateFeatureFlagRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateFeatureFlagCommand(key, request.Enabled), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }
}
