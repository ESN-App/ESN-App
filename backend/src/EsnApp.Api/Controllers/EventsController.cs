using EsnApp.Api.Contracts.Events;
using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using EsnApp.Application.Events.CreateEvent;
using EsnApp.Application.Events.DeleteEvent;
using EsnApp.Application.Events.GetEventById;
using EsnApp.Application.Events.GetEventsList;
using EsnApp.Application.Events.PatchEvent;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController(ISender sender) : ControllerBase
{
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

    /// <summary>Creates an event. Requires authentication.</summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateEventCommand(
            request.Title,
            request.ShortDescription,
            request.Description,
            request.Location,
            request.StartsAt,
            request.EndsAt,
            request.ImagePath,
            request.RegistrationUrl,
            request.MinimumParticipants,
            request.MaximumParticipants,
            request.CurrentParticipants,
            request.Price);

        var result = await sender.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>Updates selected event properties. Requires authentication.</summary>
    [HttpPatch("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Patch(
        Guid id,
        PatchEventRequest request,
        CancellationToken cancellationToken)
    {
        var command = new PatchEventCommand(
            id,
            request.Title,
            request.ShortDescription,
            request.Description,
            request.Location,
            request.StartsAt,
            request.EndsAt,
            request.ImagePath,
            request.RegistrationUrl,
            request.Status,
            request.MinimumParticipants,
            request.MaximumParticipants,
            request.CurrentParticipants,
            request.Price);

        var result = await sender.Send(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : NotFound(new { error = result.Error });
    }

    /// <summary>Deletes an event. Requires authentication.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteEventCommand(id), cancellationToken);

        return result.IsSuccess
            ? NoContent()
            : NotFound(new { error = result.Error });
    }
}
