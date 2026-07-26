using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using EsnApp.Application.Events.GetAdminEvents;
using EsnApp.Domain.Events;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/events")]
[Authorize(Roles = "Admin")]
public class AdminEventsController(ISender sender) : ControllerBase
{
    /// <summary>Lists events for administration, including drafts and archived events.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<EventDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(
        [FromQuery] EventStatus? status,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminEventsQuery(status, from, to, page, pageSize);
        var result = await sender.Send(query, cancellationToken);

        return Ok(result.Value);
    }
}
