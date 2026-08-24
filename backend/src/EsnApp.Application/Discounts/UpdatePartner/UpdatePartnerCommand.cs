using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.UpdatePartner;

public record UpdatePartnerCommand(
    Guid Id,
    string Name,
    string LogoPath,
    string ShortDescription,
    string Description,
    string? Address,
    Uri? WebsiteUrl,
    Uri? GoogleMapsUrl,
    decimal? Latitude,
    decimal? Longitude,
    int? displayOrder = null) : IRequest<Result<PartnerDto>>;
