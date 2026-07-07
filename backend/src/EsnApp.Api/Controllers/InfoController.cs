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
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetInfoArticlesListQuery(), cancellationToken);

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

    /// <summary>Creates an info article. Requires authentication.</summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(InfoArticleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(CreateInfoArticleCommand command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }
}
