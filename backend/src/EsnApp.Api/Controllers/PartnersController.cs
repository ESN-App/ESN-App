using EsnApp.Application.Discounts.Common;
using EsnApp.Application.Discounts.GetPartnersList;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/partners")]
public class PartnersController(ISender sender) : ControllerBase
{
    /// <summary>Lists the publicly visible (Active) partners.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PartnerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPartnersListQuery(), cancellationToken);

        return Ok(result.Value);
    }
}
