using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.CreatePartner;

public record CreatePartnerCommand(
    string Name,
    string LogoPath,
    string ShortDescription,
    string Description,
    string? Address,
    Uri? WebsiteUrl,
    Uri? GoogleMapsUrl,
    decimal? Latitude,
    decimal? Longitude) : IRequest<Result<PartnerDto>>;
