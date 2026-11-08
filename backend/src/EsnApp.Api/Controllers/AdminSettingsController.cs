using EsnApp.Api.Contracts.Settings;
using EsnApp.Application.Settings;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "Admin")]
public class AdminSettingsController(ISender sender) : ControllerBase
{
    /// <summary>Gets the site-wide settings for administration.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetSiteSettingsQuery(), cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>Updates the site-wide settings; the time zone must be a valid IANA id (e.g. Europe/Warsaw).</summary>
    [HttpPut]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(UpdateSiteSettingsRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new UpdateSiteSettingsCommand(request.TimeZone), cancellationToken);
        return Ok(result.Value);
    }
}
