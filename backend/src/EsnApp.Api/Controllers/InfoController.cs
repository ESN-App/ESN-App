using EsnApp.Application.Info;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/info")]
public class InfoController(ISender sender) : ControllerBase
{
    /// <summary>Lists all info articles.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<InfoArticleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetInfoArticlesListQuery(category), cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>Gets a single info article by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetInfoArticleByIdQuery(id), cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Gets a published info article by slug.</summary>
    [HttpGet("by-slug/{slug}")]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetInfoArticleBySlugQuery(slug), cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }
}
