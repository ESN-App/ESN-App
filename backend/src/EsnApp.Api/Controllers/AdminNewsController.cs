using EsnApp.Api.Contracts.News;
using EsnApp.Api.Services;
using EsnApp.Application.News.Common;
using EsnApp.Application.News.CreateNewsItem;
using EsnApp.Application.News.DeleteNewsItem;
using EsnApp.Application.News.GetAdminNewsItemById;
using EsnApp.Application.News.GetAdminNewsItems;
using EsnApp.Application.News.ReorderNewsItems;
using EsnApp.Application.News.UpdateNewsItem;
using EsnApp.Application.News.UpdateNewsItemStatus;
using EsnApp.Domain.News;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/news")]
[Authorize(Roles = "Admin")]
public class AdminNewsController(
    ISender sender,
    NewsImageStorage imageStorage) : ControllerBase
{
    /// <summary>Lists all news items for administration.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NewsItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(
        [FromQuery] NewsItemStatus? status,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminNewsItemsQuery(status), cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>Gets any news item, including a draft, for administration.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(NewsItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminNewsItemByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Creates a draft news item and stores its uploaded image.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(NewsImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(NewsItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromForm] CreateNewsItemRequest request,
        CancellationToken cancellationToken)
    {
        string? imagePath = null;

        try
        {
            imagePath = await imageStorage.SaveAsync(request.Image, cancellationToken);
            var result = await sender.Send(
                new CreateNewsItemCommand(
                    request.Title,
                    request.Description,
                    imagePath!),
                cancellationToken);

            if (!result.IsSuccess)
            {
                imageStorage.Delete(imagePath);
                return BadRequest(new { error = result.Error });
            }

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

    /// <summary>Edits a news item, replacing its image only when a new one is uploaded.</summary>
    [HttpPut("{id:guid}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(NewsImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(NewsItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromForm] UpdateNewsItemRequest request,
        CancellationToken cancellationToken)
    {
        var existingResult = await sender.Send(
            new GetAdminNewsItemByIdQuery(id), cancellationToken);
        if (!existingResult.IsSuccess)
        {
            return NotFound(new { error = existingResult.Error });
        }

        var existing = existingResult.Value!;
        string? newImagePath = null;

        try
        {
            newImagePath = await imageStorage.SaveAsync(request.Image, cancellationToken);
            var result = await sender.Send(
                new UpdateNewsItemCommand(
                    id,
                    request.Title,
                    request.Description,
                    newImagePath ?? existing.ImagePath),
                cancellationToken);

            if (!result.IsSuccess)
            {
                imageStorage.Delete(newImagePath);
                return NotFound(new { error = result.Error });
            }

            if (newImagePath is not null)
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

    /// <summary>Publishes or hides a news item.</summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(NewsItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        UpdateNewsItemStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateNewsItemStatusCommand(id, request.Status),
            cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Sets the display order of all published news items.</summary>
    [HttpPut("order")]
    [ProducesResponseType(typeof(IReadOnlyList<NewsItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Reorder(
        ReorderNewsItemsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new ReorderNewsItemsCommand(request.NewsItemIds),
            cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Deletes a news item.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteNewsItemCommand(id), cancellationToken);
        return result.IsSuccess ? NoContent() : NotFound(new { error = result.Error });
    }
}
