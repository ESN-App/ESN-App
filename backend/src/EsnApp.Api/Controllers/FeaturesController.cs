using EsnApp.Application.Features;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/features")]
public class FeaturesController(ISender sender) : ControllerBase
{
    /// <summary>Gets the runtime feature flags as a map of key to enabled state.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyDictionary<string, bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetFeatureFlagsQuery(), cancellationToken);
        return Ok(result.Value);
    }
}
