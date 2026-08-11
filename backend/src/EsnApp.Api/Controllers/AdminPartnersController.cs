using EsnApp.Api.Contracts.Partners;
using EsnApp.Api.Services;
using EsnApp.Application.Discounts.Common;
using EsnApp.Application.Discounts.CreatePartner;
using EsnApp.Application.Discounts.DeletePartner;
using EsnApp.Application.Discounts.GetAdminPartnerById;
using EsnApp.Application.Discounts.GetAdminPartnerBySlug;
using EsnApp.Application.Discounts.GetAdminPartners;
using EsnApp.Application.Discounts.GetPartnerDiscounts;
using EsnApp.Application.Discounts.ReorderPartners;
using EsnApp.Application.Discounts.UpdatePartner;
using EsnApp.Application.Discounts.UpdatePartnerStatus;
using EsnApp.Domain.Discounts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/partners")]
[Authorize(Roles = "Admin")]
public class AdminPartnersController(
    ISender sender,
    PartnerImageStorage imageStorage) : ControllerBase
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

    /// <summary>Gets a partner for administration by slug, including non-public statuses.</summary>
    [HttpGet("by-slug/{slug}")]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminPartnerBySlugQuery(slug), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Gets a partner for administration, including non-public statuses.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminPartnerByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Lists the discounts belonging to a partner, for administration.</summary>
    [HttpGet("{id:guid}/discounts")]
    [ProducesResponseType(typeof(IReadOnlyList<DiscountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDiscounts(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPartnerDiscountsQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    /// <summary>Creates a partner and stores its uploaded logo.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(PartnerImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromForm] CreateAdminPartnerRequest request,
        CancellationToken cancellationToken)
    {
        string? logoPath = null;

        try
        {
            logoPath = await imageStorage.SaveAsync(request.Logo, cancellationToken);
            var result = await sender.Send(
                new CreatePartnerCommand(
                    request.Name,
                    logoPath!,
                    request.ShortDescription,
                    request.Description,
                    request.Address,
                    request.WebsiteUrl is null ? null : new Uri(request.WebsiteUrl),
                    request.GoogleMapsUrl is null ? null : new Uri(request.GoogleMapsUrl),
                    request.Latitude,
                    request.Longitude),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, result.Value);
        }
        catch (InvalidOperationException exception)
        {
            imageStorage.Delete(logoPath);
            return BadRequest(new { error = exception.Message });
        }
        catch (UriFormatException)
        {
            imageStorage.Delete(logoPath);
            return BadRequest(new { error = "Website URL and Google Maps URL must be valid absolute URLs." });
        }
        catch
        {
            imageStorage.Delete(logoPath);
            throw;
        }
    }

    /// <summary>Updates form-managed partner fields while preserving status and display order.</summary>
    [HttpPut("{id:guid}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(PartnerImageStorage.MaximumBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromForm] UpdateAdminPartnerRequest request,
        CancellationToken cancellationToken)
    {
        var existingResult = await sender.Send(new GetAdminPartnerByIdQuery(id), cancellationToken);
        if (!existingResult.IsSuccess)
        {
            return NotFound(new { error = existingResult.Error });
        }

        var existing = existingResult.Value!;
        string? newLogoPath = null;

        try
        {
            newLogoPath = await imageStorage.SaveAsync(request.Logo, cancellationToken);
            var logoPath = newLogoPath ?? existing.LogoPath;
            var result = await sender.Send(
                new UpdatePartnerCommand(
                    id,
                    request.Name,
                    logoPath,
                    request.ShortDescription,
                    request.Description,
                    request.Address,
                    request.WebsiteUrl is null ? null : new Uri(request.WebsiteUrl),
                    request.GoogleMapsUrl is null ? null : new Uri(request.GoogleMapsUrl),
                    request.Latitude,
                    request.Longitude),
                cancellationToken);

            if (!result.IsSuccess)
            {
                imageStorage.Delete(newLogoPath);
                return NotFound(new { error = result.Error });
            }

            if (newLogoPath is not null)
            {
                imageStorage.Delete(existing.LogoPath);
            }

            return Ok(result.Value);
        }
        catch (InvalidOperationException exception)
        {
            imageStorage.Delete(newLogoPath);
            return BadRequest(new { error = exception.Message });
        }
        catch (UriFormatException)
        {
            imageStorage.Delete(newLogoPath);
            return BadRequest(new { error = "Website URL and Google Maps URL must be valid absolute URLs." });
        }
        catch
        {
            imageStorage.Delete(newLogoPath);
            throw;
        }
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

    /// <summary>Updates a partner's display order. Non-Active partners should have displayOrder set to NULL.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(PartnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDisplayOrder(
        Guid id,
        [FromBody] UpdatePartnerDisplayOrderRequest request,
        CancellationToken cancellationToken)
    {
        var existingResult = await sender.Send(new GetAdminPartnerByIdQuery(id), cancellationToken);
        if (!existingResult.IsSuccess)
        {
            return NotFound(new { error = existingResult.Error });
        }

        var existing = existingResult.Value!;
        var updateCommand = new UpdatePartnerCommand(
            id,
            existing.Name,
            existing.LogoPath,
            existing.ShortDescription,
            existing.Description,
            existing.Address,
            existing.WebsiteUrl is null ? null : new Uri(existing.WebsiteUrl),
            existing.GoogleMapsUrl is null ? null : new Uri(existing.GoogleMapsUrl),
            existing.Latitude,
            existing.Longitude,
            displayOrder: request.DisplayOrder);

        var result = await sender.Send(updateCommand, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Deletes a partner.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeletePartnerCommand(id), cancellationToken);

        return result.IsSuccess
            ? NoContent()
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
