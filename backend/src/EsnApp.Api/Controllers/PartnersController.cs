using EsnApp.Application.Discounts.Common;
using EsnApp.Application.Discounts.CreatePartner;
using EsnApp.Application.Discounts.GetPartnerById;
using EsnApp.Application.Discounts.GetPartnersList;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/partners")]
public class PartnersController(ISender sender) : ControllerBase
{
    /// <summary>Lists all partners.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PartnerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPartnersListQuery(), cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>Gets a single partner by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPartnerByIdQuery(id), cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Creates a partner. Requires authentication.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(CreatePartnerCommand command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }
}
