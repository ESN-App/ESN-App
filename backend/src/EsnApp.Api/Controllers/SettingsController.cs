using EsnApp.Application.Settings;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController(ISender sender) : ControllerBase
{
    /// <summary>Gets the site-wide settings, e.g. the IANA time zone used to show and enter dates.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(SiteSettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetSiteSettingsQuery(), cancellationToken);
        return Ok(result.Value);
    }
}
