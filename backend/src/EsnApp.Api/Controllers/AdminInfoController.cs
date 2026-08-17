using EsnApp.Api.Contracts.Info;
using EsnApp.Api.Services;
using EsnApp.Application.Info;
using EsnApp.Domain.Info;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/info")]
[Authorize(Roles = "Admin")]
public class AdminInfoController(
    ISender sender,
    InfoImageStorage imageStorage) : ControllerBase
{
    /// <summary>Lists all info articles for administration.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<InfoArticleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(
        [FromQuery] InfoArticleStatus? status,
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetAdminInfoArticlesQuery(status, category), cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>Gets any info article, including a draft, for administration.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetAdminInfoArticleByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Creates a draft info article and stores its uploaded image.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(InfoImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromForm] CreateInfoArticleRequest request,
        CancellationToken cancellationToken)
    {
        string? imagePath = null;

        try
        {
            imagePath = await imageStorage.SaveAsync(request.Image, cancellationToken);
            var result = await sender.Send(
                new CreateInfoArticleCommand(
                    request.Title,
                    request.Slug,
                    request.Content,
                    request.Category,
                    imagePath!,
                    request.ExternalLinks),
                cancellationToken);

            if (!result.IsSuccess)
            {
                imageStorage.Delete(imagePath);
                return BadRequest(new { error = result.Error });
            }

            return CreatedAtAction(nameof(InfoController.GetById), "Info",
                new { id = result.Value!.Id }, result.Value);
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

    /// <summary>Edits an info article, replacing its image only when a new one is uploaded.</summary>
    [HttpPut("{id:guid}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(InfoImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromForm] UpdateInfoArticleRequest request,
        CancellationToken cancellationToken)
    {
        var existingResult = await sender.Send(
            new GetAdminInfoArticleByIdQuery(id), cancellationToken);
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
                new UpdateInfoArticleCommand(
                    id,
                    request.Title,
                    request.Slug,
                    request.Content,
                    request.Category,
                    newImagePath ?? existing.ImagePath,
                    request.ExternalLinks),
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

    /// <summary>Publishes or hides an info article.</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        UpdateInfoArticleStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateInfoArticleStatusCommand(id, request.Status), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Sets the display order of all published info articles.</summary>
    [HttpPut("order")]
    public async Task<IActionResult> Reorder(
        ReorderInfoArticlesRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new ReorderInfoArticlesCommand(request.ArticleIds), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    /// <summary>Deletes an info article.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteInfoArticleCommand(id), cancellationToken);
        return result.IsSuccess ? NoContent() : NotFound(new { error = result.Error });
    }
}
