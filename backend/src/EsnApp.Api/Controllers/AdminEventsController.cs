using EsnApp.Api.Contracts.Events;
using EsnApp.Api.Services;
using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using EsnApp.Application.Events.CreateEvent;
using EsnApp.Application.Events.DeleteEvent;
using EsnApp.Application.Events.GetAdminEvents;
using EsnApp.Application.Events.GetAdminEventById;
using EsnApp.Application.Events.UpdateAdminEvent;
using EsnApp.Application.Events.UpdateEventStatus;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/events")]
[Authorize(Roles = "Admin")]
public class AdminEventsController(
    ISender sender,
    EventImageStorage imageStorage) : ControllerBase
{
    /// <summary>Lists events for administration, including drafts and archived events.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<EventDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminEventsQuery(page, pageSize);
        var result = await sender.Send(query, cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>Changes an event workflow status.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Patch(
        Guid id,
        UpdateEventStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new UpdateEventStatusCommand(id, request.Status), cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Deletes an event.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteEventCommand(id), cancellationToken);
        return result.IsSuccess ? NoContent() : NotFound(new { error = result.Error });
    }

    /// <summary>Gets an event for administration, including non-public statuses.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminEventByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Creates an event and stores its optional uploaded image.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(EventImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromForm] CreateAdminEventRequest request,
        CancellationToken cancellationToken)
    {
        string? imagePath = null;

        try
        {
            imagePath = await imageStorage.SaveAsync(request.Image, cancellationToken);
            var result = await sender.Send(
                new CreateEventCommand(
                    request.Title,
                    request.ShortDescription,
                    request.Description,
                    request.Location,
                    request.GoogleMapsUrl,
                    request.StartsAt,
                    request.EndsAt,
                    imagePath,
                    request.RegistrationUrl,
                    request.MinimumParticipants,
                    request.MaximumParticipants,
                    null,
                    request.Price),
                cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = result.Value!.Id },
                result.Value);
        }
        catch (InvalidOperationException exception)
        {
            imageStorage.Delete(imagePath);
            return BadRequest(new { error = exception.Message });
        }
        catch
        {
            imageStorage.Delete(imagePath);
            throw;
        }
    }


    /// <summary>Updates form-managed event fields while preserving workflow status and participants.</summary>
    [HttpPut("{id:guid}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(EventImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromForm] UpdateAdminEventRequest request,
        CancellationToken cancellationToken)
    {
        var existingResult = await sender.Send(new GetAdminEventByIdQuery(id), cancellationToken);
        if (!existingResult.IsSuccess)
        {
            return NotFound(new { error = existingResult.Error });
        }

        var existing = existingResult.Value!;
        string? newImagePath = null;
        try
        {
            newImagePath = await imageStorage.SaveAsync(request.Image, cancellationToken);
            var imagePath = newImagePath ?? (request.RemoveImage ? null : existing.ImagePath);
            var result = await sender.Send(
                new UpdateAdminEventCommand(
                    id,
                    request.Title,
                    request.ShortDescription,
                    request.Description,
                    request.Location,
                    request.GoogleMapsUrl,
                    request.StartsAt,
                    request.EndsAt,
                    imagePath,
                    request.RegistrationUrl,
                    request.MinimumParticipants,
                    request.MaximumParticipants,
                    request.Price),
                cancellationToken);

            if (!result.IsSuccess)
            {
                imageStorage.Delete(newImagePath);
                return NotFound(new { error = result.Error });
            }

            if ((newImagePath is not null || request.RemoveImage) && existing.ImagePath != imagePath)
            {
                imageStorage.Delete(existing.ImagePath);
            }

            return Ok(result.Value);
        }
        catch (InvalidOperationException exception)
        {
            imageStorage.Delete(newImagePath);
            return BadRequest(new { error = exception.Message });
        }
        catch
        {
            imageStorage.Delete(newImagePath);
            throw;
        }
    }
}
