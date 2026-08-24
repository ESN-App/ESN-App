using EsnApp.Application.Discounts.Common;
using EsnApp.Application.Discounts.GetDiscountsList;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/discounts")]
public class DiscountsController(ISender sender) : ControllerBase
{
    /// <summary>Lists the offers of publicly visible (Active) partners.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DiscountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDiscountsListQuery(), cancellationToken);

        return Ok(result.Value);
    }
}
