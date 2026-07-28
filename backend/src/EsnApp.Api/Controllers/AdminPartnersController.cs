using EsnApp.Api.Contracts.Partners;
using EsnApp.Application.Discounts.Common;
using EsnApp.Application.Discounts.GetAdminPartners;
using EsnApp.Application.Discounts.ReorderPartners;
using EsnApp.Application.Discounts.UpdatePartnerStatus;
using EsnApp.Domain.Discounts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/partners")]
[Authorize(Roles = "Admin")]
public class AdminPartnersController(ISender sender) : ControllerBase
{
    /// <summary>Lists all partners for administration, optionally filtered by status.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PartnerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(
        [FromQuery] PartnerStatus? status,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetAdminPartnersQuery(status),
            cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>Changes a partner's publication status.</summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        UpdatePartnerStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdatePartnerStatusCommand(id, request.Status),
            cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : NotFound(new { error = result.Error });
    }

    /// <summary>Sets the display order of all active partners.</summary>
    [HttpPut("order")]
    [ProducesResponseType(typeof(IReadOnlyList<PartnerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Reorder(
        ReorderPartnersRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new ReorderPartnersCommand(request.PartnerIds),
            cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }
}
