using EsnApp.Application.News.Common;
using EsnApp.Application.News.GetNewsItemById;
using EsnApp.Application.News.GetNewsItems;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/news")]
public class NewsController(ISender sender) : ControllerBase
{
    /// <summary>Lists published news items in display order.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NewsItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNewsItemsQuery(), cancellationToken);
        return Ok(result.Value);
    }

    /// <summary>Gets a published news item by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(NewsItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNewsItemByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }
}
