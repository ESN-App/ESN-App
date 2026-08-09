using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using EsnApp.Application.Events.GetAvailableEventMonths;
using EsnApp.Application.Events.GetEventById;
using EsnApp.Application.Events.GetEventsList;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController(ISender sender) : ControllerBase
{
    /// <summary>Lists calendar months containing published events.</summary>
    [HttpGet("months")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableMonths(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAvailableEventMonthsQuery(), cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>Lists all events.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<EventListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetList(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var effectiveFrom = from ?? DateTimeOffset.UtcNow;
        var effectiveTo = to ?? effectiveFrom.AddMonths(1);
        var query = new GetEventsListQuery(effectiveFrom, effectiveTo, page, pageSize);
        var result = await sender.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>Gets a single event by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetEventByIdQuery(id), cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

}
