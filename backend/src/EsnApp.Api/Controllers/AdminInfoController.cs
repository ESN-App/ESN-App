using EsnApp.Api.Contracts.Info;
using EsnApp.Application.Info;
using EsnApp.Domain.Info;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/info")]
[Authorize(Roles = "Admin")]
public class AdminInfoController(ISender sender) : ControllerBase
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

    /// <summary>Creates a draft info article.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        CreateInfoArticleCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(InfoController.GetById), "Info",
                new { id = result.Value!.Id }, result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Edits an info article.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateInfoArticleRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateInfoArticleCommand(
            id,
            request.Title,
            request.Slug,
            request.Content,
            request.Category,
            request.ImageUrl,
            request.ExternalLinks);
        var result = await sender.Send(command, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
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
