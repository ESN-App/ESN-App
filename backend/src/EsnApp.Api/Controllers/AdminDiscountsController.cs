using EsnApp.Api.Contracts.Discounts;
using EsnApp.Application.Discounts.Common;
using EsnApp.Application.Discounts.CreateDiscount;
using EsnApp.Application.Discounts.DeleteDiscount;
using EsnApp.Application.Discounts.GetAdminDiscounts;
using EsnApp.Application.Discounts.UpdateDiscount;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/discounts")]
[Authorize(Roles = "Admin")]
public class AdminDiscountsController(ISender sender) : ControllerBase
{
    /// <summary>Lists every offer for administration, including offers of non-public partners.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DiscountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminDiscountsQuery(), cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>Creates an offer for an existing partner.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(DiscountDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(CreateDiscountCommand command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Updates an offer's title and description.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DiscountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateDiscountRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateDiscountCommand(id, request.Title, request.Description),
            cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Deletes an offer.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteDiscountCommand(id), cancellationToken);

        return result.IsSuccess ? NoContent() : NotFound(new { error = result.Error });
    }
}
